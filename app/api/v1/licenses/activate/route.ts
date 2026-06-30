import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { activateLicenseSchema } from '@/lib/utils/validators'

// Simple rate limiting (shared with verify module)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const WINDOW_MS = 60_000

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = activateLicenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { license_key, machine_id, machine_name } = parsed.data
  const supabase = createAdminClient()
  const now = new Date()

  // Fetch license
  const { data: license } = await supabase
    .from('licenses')
    .select('id, status, type, expires_at, max_activations, activation_count')
    .eq('license_key', license_key)
    .single()

  if (!license) {
    return NextResponse.json({ error: 'License not found' }, { status: 404 })
  }

  // Check license validity
  if (license.status === 'revoked') {
    return NextResponse.json({ error: 'License has been revoked' }, { status: 403 })
  }
  if (license.status === 'suspended') {
    return NextResponse.json({ error: 'License is suspended' }, { status: 403 })
  }
  if (
    license.expires_at &&
    new Date(license.expires_at) < now
  ) {
    return NextResponse.json({ error: 'License has expired' }, { status: 403 })
  }

  // Check if machine is already activated
  const { data: existingActivation } = await supabase
    .from('license_activations')
    .select('id, is_active')
    .eq('license_id', license.id)
    .eq('machine_id', machine_id)
    .single()

  if (existingActivation) {
    // Reactivate if inactive
    if (!existingActivation.is_active) {
      await supabase
        .from('license_activations')
        .update({ is_active: true, last_seen_at: now.toISOString() })
        .eq('id', existingActivation.id)

      await supabase
        .from('licenses')
        .update({ activation_count: license.activation_count + 1 })
        .eq('id', license.id)
    } else {
      // Already active — just update last_seen
      await supabase
        .from('license_activations')
        .update({ last_seen_at: now.toISOString() })
        .eq('id', existingActivation.id)
    }

    await supabase.from('license_events').insert({
      license_id: license.id,
      event_type: 'activated',
      machine_id,
      ip_address: ip,
      metadata: { reactivated: true },
    })

    return NextResponse.json({ success: true, message: 'License activated' })
  }

  // Check activation limit
  if (license.activation_count >= license.max_activations) {
    return NextResponse.json(
      {
        error: 'Activation limit reached',
        current: license.activation_count,
        max: license.max_activations,
      },
      { status: 403 }
    )
  }

  // Create new activation
  const { error: activationError } = await supabase
    .from('license_activations')
    .insert({
      license_id: license.id,
      machine_id,
      machine_name: machine_name ?? null,
      ip_address: ip,
      is_active: true,
    })

  if (activationError) {
    return NextResponse.json({ error: 'Failed to create activation' }, { status: 500 })
  }

  // Increment activation count
  await supabase
    .from('licenses')
    .update({ activation_count: license.activation_count + 1 })
    .eq('id', license.id)

  await supabase.from('license_events').insert({
    license_id: license.id,
    event_type: 'activated',
    machine_id,
    ip_address: ip,
  })

  return NextResponse.json({
    success: true,
    message: 'License activated successfully',
    activations: {
      current: license.activation_count + 1,
      max: license.max_activations,
      remaining: license.max_activations - license.activation_count - 1,
    },
  })
}
