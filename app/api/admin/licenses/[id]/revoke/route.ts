import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const bodySchema = z.object({
  reason: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing reason' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: license } = await admin
    .from('licenses')
    .select('id, license_key, status')
    .eq('id', id)
    .single()

  if (!license) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (license.status === 'revoked') {
    return NextResponse.json({ error: 'Already revoked' }, { status: 400 })
  }

  await admin
    .from('licenses')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revocation_reason: parsed.data.reason,
    })
    .eq('id', id)

  await admin.from('license_events').insert({
    license_id: id,
    event_type: 'revoked',
    metadata: { reason: parsed.data.reason, revoked_by: user.id },
  })

  return NextResponse.json({ success: true })
}
