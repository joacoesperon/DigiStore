import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { reviewSchema } from '@/lib/utils/validators'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = reviewSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid review data' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: license } = await service
    .from('licenses')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!license) {
    return NextResponse.json(
      { error: 'You need a license for this product to review it' },
      { status: 403 }
    )
  }

  const { error } = await service.from('reviews').insert({
    product_id: productId,
    user_id: user.id,
    license_id: license.id,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body ?? null,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You already reviewed this product' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
