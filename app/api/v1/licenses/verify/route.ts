import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyLicenseSchema } from '@/lib/utils/validators'
import type { LicenseVerifyResponse } from '@/types'

// Simple in-memory rate limiting (resets on server restart)
// For production, use Upstash Redis or a persistent store.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 60      // max requests
const WINDOW_MS = 60_000  // per 60 seconds

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
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      }
    )
  }

  // Parse body
  const body = await request.json().catch(() => null)
  const parsed = verifyLicenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { license_key, machine_id } = parsed.data
  const supabase = createAdminClient()

  // Look up license
  const { data: license } = await supabase
    .from('licenses')
    .select(`
      id, status, type, expires_at, max_activations, activation_count, product_id,
      products!inner(id, name)
    `)
    .eq('license_key', license_key)
    .single()

  if (!license) {
    const response: LicenseVerifyResponse = {
      valid: false,
      status: 'not_found',
      type: null,
      expires_at: null,
      product: null,
      activations: null,
    }
    return NextResponse.json(response)
  }

  // Check status
  let effectiveStatus = license.status as LicenseVerifyResponse['status']
  const now = new Date()

  // Check expiration
  if (
    license.expires_at &&
    new Date(license.expires_at) < now &&
    license.status !== 'revoked' &&
    license.status !== 'suspended'
  ) {
    // Mark as expired in DB
    await supabase
      .from('licenses')
      .update({ status: 'expired', updated_at: now.toISOString() })
      .eq('id', license.id)

    await supabase.from('license_events').insert({
      license_id: license.id,
      event_type: 'expired',
      ip_address: ip,
    })

    effectiveStatus = 'expired'
  }

  const isValid = effectiveStatus === 'active' || effectiveStatus === 'trial'

  // If machine_id provided, verify that machine is activated
  let machineValid = true
  if (isValid && machine_id) {
    const { data: activation } = await supabase
      .from('license_activations')
      .select('id, last_seen_at')
      .eq('license_id', license.id)
      .eq('machine_id', machine_id)
      .eq('is_active', true)
      .single()

    if (!activation) {
      machineValid = false
    } else {
      // Update last_seen_at
      await supabase
        .from('license_activations')
        .update({ last_seen_at: now.toISOString() })
        .eq('id', activation.id)
    }
  }

  // Log verification event
  await supabase.from('license_events').insert({
    license_id: license.id,
    event_type: 'verified',
    machine_id: machine_id ?? null,
    ip_address: ip,
    metadata: { valid: isValid && machineValid, machine_check: !!machine_id },
  })

  const product = Array.isArray(license.products) ? license.products[0] : license.products as { id: string; name: string }

  const response: LicenseVerifyResponse = {
    valid: isValid && machineValid,
    status: effectiveStatus,
    type: license.type,
    expires_at: license.expires_at,
    product: product ? { id: product.id, name: product.name } : null,
    activations: {
      current: license.activation_count,
      max: license.max_activations,
    },
  }

  // Valid licenses are never cached (status can change at any time).
  // Invalid / negative responses can be edge-cached for 30 s to reduce DB load.
  const cacheControl =
    response.valid
      ? 'no-store'
      : 'public, max-age=30, s-maxage=30, stale-while-revalidate=10'

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': cacheControl,
    },
  })
}
