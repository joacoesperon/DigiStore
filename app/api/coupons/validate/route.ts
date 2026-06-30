import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  code: z.string().min(1),
  planPrice: z.number().positive(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 })
  }

  const { code, planPrice } = parsed.data

  // Validate coupon server-side — uses anon client (RLS restricts access, but we
  // can use service role or public-safe read depending on RLS policy)
  const supabase = await createClient()

  // Admin client to read coupons safely
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const now = new Date().toISOString()
  const { data: coupon } = await admin
    .from('coupons')
    .select('id, code, type, value, min_order_amount, max_uses, used_count, expires_at, is_active')
    .eq('code', code.toUpperCase())
    .single()

  if (
    !coupon ||
    !coupon.is_active ||
    (coupon.expires_at && coupon.expires_at <= now) ||
    (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) ||
    (coupon.min_order_amount !== null && planPrice < coupon.min_order_amount)
  ) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired coupon' })
  }

  const discountAmount =
    coupon.type === 'percentage'
      ? Math.round(planPrice * (coupon.value / 100))
      : Math.min(coupon.value, planPrice)

  // Authenticate user to prevent abuse
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ valid: false, error: 'Please sign in to apply a coupon' }, { status: 401 })
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    },
  })
}
