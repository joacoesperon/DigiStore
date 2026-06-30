import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  const admin = createAdminClient()

  const { data: license } = await admin
    .from('licenses')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!license) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (license.status === 'revoked') {
    return NextResponse.json({ error: 'Cannot suspend a revoked license' }, { status: 400 })
  }

  const isSuspended = license.status === 'suspended'
  const newStatus = isSuspended ? 'active' : 'suspended'

  await admin
    .from('licenses')
    .update({ status: newStatus })
    .eq('id', id)

  await admin.from('license_events').insert({
    license_id: id,
    event_type: isSuspended ? 'reactivated' : 'suspended',
    metadata: { toggled_by: user.id },
  })

  return NextResponse.json({ success: true, status: newStatus })
}
