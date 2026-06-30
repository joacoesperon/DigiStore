import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deactivateLicenseSchema } from '@/lib/utils/validators'

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
  const parsed = deactivateLicenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { license_key, machine_id } = parsed.data
  const supabase = createAdminClient()
  const now = new Date()

  // Fetch license
  const { data: license } = await supabase
    .from('licenses')
    .select('id, activation_count')
    .eq('license_key', license_key)
    .single()

  if (!license) {
    return NextResponse.json({ error: 'License not found' }, { status: 404 })
  }

  // Find activation
  const { data: activation } = await supabase
    .from('license_activations')
    .select('id, is_active')
    .eq('license_id', license.id)
    .eq('machine_id', machine_id)
    .single()

  if (!activation) {
    return NextResponse.json({ error: 'Activation not found for this machine' }, { status: 404 })
  }

  if (!activation.is_active) {
    return NextResponse.json({ error: 'Machine is already deactivated' }, { status: 409 })
  }

  // Deactivate
  await supabase
    .from('license_activations')
    .update({ is_active: false, last_seen_at: now.toISOString() })
    .eq('id', activation.id)

  const newCount = Math.max(0, license.activation_count - 1)
  await supabase
    .from('licenses')
    .update({ activation_count: newCount })
    .eq('id', license.id)

  await supabase.from('license_events').insert({
    license_id: license.id,
    event_type: 'deactivated',
    machine_id,
    ip_address: ip,
  })

  return NextResponse.json({
    success: true,
    message: 'Machine deactivated successfully',
    activations_remaining: newCount,
  })
}
