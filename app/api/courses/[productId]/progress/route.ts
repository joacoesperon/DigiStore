import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { lesson_id, completed } = body as { lesson_id?: string; completed?: boolean }
  if (!lesson_id) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

  const serviceClient = createServiceClient()

  // Anti-IDOR: verify user has active license for this product
  const { data: license } = await serviceClient
    .from('licenses')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .in('status', ['active', 'trial'])
    .limit(1)
    .single()

  if (!license) return NextResponse.json({ error: 'No active license' }, { status: 403 })

  // Verify lesson belongs to this product
  const { data: lesson } = await serviceClient
    .from('course_lessons')
    .select('id')
    .eq('id', lesson_id)
    .eq('product_id', productId)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  if (completed === false) {
    await serviceClient
      .from('course_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('lesson_id', lesson_id)
  } else {
    await serviceClient
      .from('course_progress')
      .upsert(
        { user_id: user.id, lesson_id, product_id: productId },
        { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
      )
  }

  return NextResponse.json({ ok: true })
}
