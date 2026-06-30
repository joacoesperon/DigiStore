import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateUniqueLicenseKey } from '@/lib/licenses/generate'
import {
  sendPaymentFailedEmail,
  sendPaymentRecoveredEmail,
  sendSubscriptionCancelledEmail,
  sendPurchaseConfirmationEmail,
} from '@/lib/email/send'
import type Stripe from 'stripe'
import { addDays, addMonths, addYears } from 'date-fns'

type LicensePlanType = 'perpetual' | 'subscription' | 'trial'

function calculateExpiresAt(
  type: LicensePlanType,
  billingInterval: 'month' | 'year' | null,
  trialDays: number | null
): string | null {
  const now = new Date()
  if (type === 'perpetual') return null
  if (type === 'trial') return addDays(now, trialDays ?? 14).toISOString()
  if (type === 'subscription') {
    return billingInterval === 'year'
      ? addYears(now, 1).toISOString()
      : addMonths(now, 1).toISOString()
  }
  return null
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const meta = session.metadata
  if (!meta?.user_id || !meta?.product_id || !meta?.license_plan_id) return

  const supabase = createAdminClient()

  // Obtener configuración del plan
  const { data: plan } = await supabase
    .from('license_plans')
    .select('id, type, price, billing_interval, trial_days, max_activations')
    .eq('id', meta.license_plan_id)
    .single()

  if (!plan) return

  // Idempotencia: si ya existe licencia activa para este plan no crear otra
  // (puede ocurrir si Stripe reintenta el webhook)
  const { data: existingLicense } = await supabase
    .from('licenses')
    .select('id')
    .eq('user_id', meta.user_id)
    .eq('license_plan_id', meta.license_plan_id)
    .in('status', ['active', 'trial'])
    .maybeSingle()

  if (existingLicense) {
    console.log('[webhook] License already exists for this plan, skipping duplicate creation')
    return
  }

  // Crear orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: meta.user_id,
      status: 'completed' as const,
      total_amount: session.amount_total ?? plan.price,
      discount_amount: Number(meta.discount_amount ?? 0),
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent
        ? String(session.payment_intent)
        : null,
      stripe_subscription_id: session.subscription
        ? String(session.subscription)
        : null,
      coupon_id: meta.coupon_id || null,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('[webhook] Failed to create order:', orderError)
    return
  }

  // Crear order item
  const { data: orderItem, error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: order.id,
      product_id: meta.product_id,
      license_plan_id: meta.license_plan_id,
      price: session.amount_total ?? plan.price,
    })
    .select('id')
    .single()

  if (itemError || !orderItem) {
    console.error('[webhook] Failed to create order item:', itemError)
    return
  }

  // Generar license key única
  const licenseKey = await generateUniqueLicenseKey(async (key) => {
    const { data } = await supabase
      .from('licenses')
      .select('id')
      .eq('license_key', key)
      .single()
    return !!data
  })

  if (!licenseKey) {
    console.error('[webhook] Failed to generate unique license key')
    return
  }

  const hasStripeTrial = plan.type === 'subscription' && !!plan.trial_days && plan.trial_days > 0

  const licenseStatus: 'trial' | 'active' =
    plan.type === 'trial' || hasStripeTrial ? 'trial' : 'active'

  const expiresAt = hasStripeTrial
    ? addDays(new Date(), plan.trial_days!).toISOString()
    : calculateExpiresAt(plan.type as LicensePlanType, plan.billing_interval, plan.trial_days)

  // Crear licencia
  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .insert({
      license_key: licenseKey,
      user_id: meta.user_id,
      product_id: meta.product_id,
      license_plan_id: meta.license_plan_id,
      order_item_id: orderItem.id,
      status: licenseStatus,
      type: plan.type as LicensePlanType,
      max_activations: plan.max_activations,
      activation_count: 0,
      expires_at: expiresAt,
      stripe_subscription_id: session.subscription
        ? String(session.subscription)
        : null,
    })
    .select('id')
    .single()

  if (licenseError || !license) {
    console.error('[webhook] Failed to create license:', licenseError)
    return
  }

  // Registrar evento de emisión
  await supabase.from('license_events').insert({
    license_id: license.id,
    event_type: 'issued' as const,
    metadata: { plan_type: plan.type, order_id: order.id },
  })

  // Incrementar uso del cupón si aplica
  if (meta.coupon_id) {
    await supabase.rpc('increment_coupon_usage', {
      p_coupon_id: meta.coupon_id,
    })
  }

  // Enviar email de confirmación de compra (best effort)
  sendPurchaseConfirmationEmail(
    license.id,
    session.amount_total ?? plan.price,
    licenseStatus === 'trial' ? 'trial' : (plan.type as 'perpetual' | 'subscription'),
    expiresAt
  ).catch(() => {})
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId =
    invoice.parent?.type === 'subscription_details'
      ? invoice.parent.subscription_details?.subscription
      : null

  if (!subscriptionId) return

  const subId = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id

  const supabase = createAdminClient()

  const { data: license } = await supabase
    .from('licenses')
    .select('id, user_id')
    .eq('stripe_subscription_id', subId)
    .single()

  if (!license) return

  await supabase
    .from('licenses')
    .update({ status: 'suspended' as const, updated_at: new Date().toISOString() })
    .eq('id', license.id)

  await supabase.from('license_events').insert({
    license_id: license.id,
    event_type: 'suspended' as const,
    metadata: {
      reason: 'payment_failed',
      next_payment_attempt: invoice.next_payment_attempt ?? null,
    },
  })

  await sendPaymentFailedEmail(license.id, invoice.next_payment_attempt ?? null)
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // En Stripe API v2026, la suscripción está en invoice.parent.subscription_details
  const subscriptionId =
    invoice.parent?.type === 'subscription_details'
      ? invoice.parent.subscription_details?.subscription
      : null

  if (!subscriptionId) return

  const subId = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id

  const supabase = createAdminClient()

  const { data: license } = await supabase
    .from('licenses')
    .select('id, license_plan_id, status, user_id')
    .eq('stripe_subscription_id', subId)
    .single()

  if (!license) return

  const { data: plan } = await supabase
    .from('license_plans')
    .select('billing_interval')
    .eq('id', license.license_plan_id)
    .single()

  const now = new Date()
  const newExpiresAt =
    plan?.billing_interval === 'year'
      ? addYears(now, 1).toISOString()
      : addMonths(now, 1).toISOString()

  await supabase
    .from('licenses')
    .update({
      status: 'active' as const,
      expires_at: newExpiresAt,
      updated_at: now.toISOString(),
    })
    .eq('id', license.id)

  await supabase.from('license_events').insert({
    license_id: license.id,
    event_type: 'renewed' as const,
    metadata: { expires_at: newExpiresAt },
  })

  if (license.status === 'suspended') {
    await sendPaymentRecoveredEmail(license.id)
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient()

  const { data: license } = await supabase
    .from('licenses')
    .select('id, cancel_at_period_end')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!license) return

  await supabase
    .from('licenses')
    .update({ cancel_at_period_end: subscription.cancel_at_period_end })
    .eq('id', license.id)

  // Send cancellation email only when transitioning from false → true
  if (subscription.cancel_at_period_end && !license.cancel_at_period_end) {
    await sendSubscriptionCancelledEmail(license.id)
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const supabase = createAdminClient()

  const { data: license } = await supabase
    .from('licenses')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!license) return

  const now = new Date().toISOString()

  await supabase
    .from('licenses')
    .update({ status: 'expired' as const, updated_at: now })
    .eq('id', license.id)

  await supabase.from('license_events').insert({
    license_id: license.id,
    event_type: 'expired' as const,
    metadata: { reason: 'subscription_cancelled' },
  })
}

// Re-exportamos stripe para que no sea necesario importarlo por separado en la route
export { stripe }
