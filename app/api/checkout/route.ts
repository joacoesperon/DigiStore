import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'
import { generateUniqueLicenseKey } from '@/lib/licenses/generate'
import { addDays } from 'date-fns'
import { z } from 'zod'

const bodySchema = z.object({
  productId: z.string().uuid(),
  planId: z.string().uuid(),
  couponCode: z.string().optional(),
})

export async function POST(request: Request) {
  // 1. Authenticate user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate body
  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { productId, planId, couponCode } = parsed.data

  // 3. Fetch product + plan
  const { data: product } = await supabase
    .from('products')
    .select('id, name, short_description, thumbnail_url')
    .eq('id', productId)
    .eq('status', 'published')
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const { data: plan } = await supabase
    .from('license_plans')
    .select('*')
    .eq('id', planId)
    .eq('product_id', productId)
    .eq('is_active', true)
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // 4. Verificar que el usuario no tenga ya una licencia para este plan
  const supabaseAdmin = createAdminClient()

  if (plan.type === 'trial') {
    // Trials: bloquear si el usuario ya tuvo alguna vez este trial (cualquier status)
    const { data: anyTrialLicense } = await supabaseAdmin
      .from('licenses')
      .select('id')
      .eq('user_id', user.id)
      .eq('license_plan_id', planId)
      .eq('type', 'trial')
      .maybeSingle()

    if (anyTrialLicense) {
      return NextResponse.json(
        { error: 'You have already used your trial for this plan' },
        { status: 409 }
      )
    }
  } else {
    // Otros planes: bloquear si ya hay una licencia activa o en trial
    const { data: existingLicense } = await supabaseAdmin
      .from('licenses')
      .select('id')
      .eq('user_id', user.id)
      .eq('license_plan_id', planId)
      .in('status', ['active', 'trial'])
      .maybeSingle()

    if (existingLicense) {
      return NextResponse.json(
        { error: 'You already have an active license for this plan' },
        { status: 409 }
      )
    }
  }

  // 5. Handle free plan — no Stripe needed
  if (plan.price === 0 || plan.type === 'trial') {
    const licenseKey = await generateUniqueLicenseKey(async (key) => {
      const { data } = await supabaseAdmin
        .from('licenses')
        .select('id')
        .eq('license_key', key)
        .single()
      return !!data
    })

    if (!licenseKey) {
      return NextResponse.json({ error: 'Failed to generate license key' }, { status: 500 })
    }

    const isTrial = plan.type === 'trial'

    const expiresAt = isTrial && plan.trial_days
      ? addDays(new Date(), plan.trial_days).toISOString()
      : null

    const { data: order } = await supabaseAdmin.from('orders').insert({
      user_id: user.id,
      status: 'completed' as const,
      total_amount: 0,
      discount_amount: 0,
    }).select('id').single()

    if (order) {
      const { data: orderItem } = await supabaseAdmin.from('order_items').insert({
        order_id: order.id,
        product_id: productId,
        license_plan_id: planId,
        price: 0,
      }).select('id').single()

      if (orderItem) {
        await supabaseAdmin.from('licenses').insert({
          license_key: licenseKey,
          user_id: user.id,
          product_id: productId,
          license_plan_id: planId,
          order_item_id: orderItem.id,
          status: isTrial ? 'trial' as const : 'active' as const,
          type: plan.type as 'perpetual' | 'subscription' | 'trial',
          max_activations: plan.max_activations,
          expires_at: expiresAt,
        })

        await supabaseAdmin.from('license_events').insert({
          license_id: (await supabaseAdmin.from('licenses').select('id').eq('license_key', licenseKey).single()).data?.id ?? '',
          event_type: 'issued' as const,
          metadata: { plan_type: plan.type, order_id: order.id },
        })
      }
    }

    return NextResponse.json({ licenseKey, planType: plan.type })
  }

  // 6. Validate coupon if provided
  let discountAmount = 0
  let couponId: string | null = null

  if (couponCode) {
    const now = new Date().toISOString()
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (
      coupon &&
      (!coupon.expires_at || coupon.expires_at > now) &&
      (!coupon.max_uses || coupon.used_count < coupon.max_uses) &&
      (!coupon.min_order_amount || plan.price >= coupon.min_order_amount)
    ) {
      couponId = coupon.id
      if (coupon.type === 'percentage') {
        discountAmount = Math.round(plan.price * (coupon.value / 100))
      } else {
        discountAmount = Math.min(coupon.value, plan.price)
      }
    }
  }

  const unitAmount = Math.max(0, plan.price - discountAmount)

  // 7. Create Stripe Checkout Session
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  const isSubscription = plan.type === 'subscription'
  const hasStripeTrial = isSubscription && !!plan.trial_days && plan.trial_days > 0

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    payment_method_collection: hasStripeTrial ? 'always' : undefined,
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          unit_amount: unitAmount,
          ...(isSubscription && {
            recurring: { interval: (plan.billing_interval ?? 'month') as 'month' | 'year' },
          }),
          product_data: {
            name: `${product.name} — ${plan.name}`,
            description: product.short_description ?? undefined,
            images: product.thumbnail_url ? [product.thumbnail_url] : [],
          },
        },
        quantity: 1,
      },
    ],
    ...(hasStripeTrial && {
      subscription_data: { trial_period_days: plan.trial_days! },
    }),
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
    customer_email: user.email,
    metadata: {
      user_id: user.id,
      product_id: productId,
      license_plan_id: planId,
      coupon_id: couponId ?? '',
      discount_amount: String(discountAmount),
    },
  })

  return NextResponse.json({ url: session.url })
}
