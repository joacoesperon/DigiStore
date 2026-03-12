import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Fetch license — filter by user_id to prevent IDOR
  const { data: license } = await supabase
    .from('licenses')
    .select('id, status, stripe_subscription_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!license) {
    return NextResponse.json({ error: 'License not found' }, { status: 404 })
  }

  if (license.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'Paid subscriptions cannot be discarded — use cancel subscription instead' },
      { status: 400 }
    )
  }

  if (!['active', 'trial'].includes(license.status)) {
    return NextResponse.json(
      { error: 'Only active or trial licenses can be discarded' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('licenses')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revocation_reason: 'Discarded by user',
    })
    .eq('id', license.id)

  if (error) {
    console.error('[licenses/discard] DB update failed:', error)
    return NextResponse.json({ error: 'Failed to discard license' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
