import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

export async function POST(request: Request) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { licenseId?: string; action?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { licenseId, action } = body

  if (!licenseId || (action !== 'cancel' && action !== 'reactivate')) {
    return NextResponse.json(
      { error: 'licenseId and action ("cancel" | "reactivate") are required' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Fetch the license — filter by user_id to prevent IDOR
  const { data: license } = await supabase
    .from('licenses')
    .select('id, type, status, stripe_subscription_id, cancel_at_period_end')
    .eq('id', licenseId)
    .eq('user_id', user.id)
    .single()

  if (!license) {
    return NextResponse.json({ error: 'License not found' }, { status: 404 })
  }

  if (license.type !== 'subscription') {
    return NextResponse.json({ error: 'This license is not a subscription' }, { status: 400 })
  }

  if (license.status !== 'active') {
    return NextResponse.json({ error: 'License is not active' }, { status: 400 })
  }

  if (!license.stripe_subscription_id) {
    return NextResponse.json({ error: 'No Stripe subscription found for this license' }, { status: 400 })
  }

  const cancelAtPeriodEnd = action === 'cancel'

  // Update Stripe subscription
  try {
    await stripe.subscriptions.update(license.stripe_subscription_id, {
      cancel_at_period_end: cancelAtPeriodEnd,
    })
  } catch (err) {
    console.error('[subscriptions/cancel] Stripe update failed:', err)
    return NextResponse.json({ error: 'Failed to update subscription with Stripe' }, { status: 500 })
  }

  // Update local DB
  const { error: dbError } = await supabase
    .from('licenses')
    .update({ cancel_at_period_end: cancelAtPeriodEnd })
    .eq('id', license.id)

  if (dbError) {
    console.error('[subscriptions/cancel] DB update failed:', dbError)
    return NextResponse.json({ error: 'Stripe updated but local record failed to sync' }, { status: 500 })
  }

  return NextResponse.json({ success: true, cancel_at_period_end: cancelAtPeriodEnd })
}
