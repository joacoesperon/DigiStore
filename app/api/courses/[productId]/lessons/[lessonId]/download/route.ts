import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string; lessonId: string }> }
) {
  const { productId, lessonId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Verify lesson exists, belongs to this product, and has a file
  const { data: lesson } = await admin
    .from('course_lessons')
    .select('id, file_path')
    .eq('id', lessonId)
    .eq('product_id', productId)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  if (!lesson.file_path) return NextResponse.json({ error: 'No file for this lesson' }, { status: 404 })

  // Verify active license
  const { data: license } = await admin
    .from('licenses')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .in('status', ['active', 'trial'])
    .limit(1)
    .single()

  if (!license) return NextResponse.json({ error: 'No active license' }, { status: 403 })

  // Generate signed URL (1 hour)
  const { data: signed, error } = await admin.storage
    .from('product-files')
    .createSignedUrl(lesson.file_path, 3600, { download: true })

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
