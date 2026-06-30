import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user : null
}

// POST /api/admin/lesson-upload
// FormData: file, lessonId, currentFilePath?
export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const lessonId = formData.get('lessonId') as string | null
  const currentFilePath = formData.get('currentFilePath') as string | null

  if (!file || !lessonId) {
    return NextResponse.json({ error: 'Missing file or lessonId' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  if (currentFilePath) {
    await serviceClient.storage.from('product-files').remove([currentFilePath])
  }

  const path = `courses/${lessonId}/${file.name}`
  const arrayBuffer = await file.arrayBuffer()

  const { data, error } = await serviceClient.storage
    .from('product-files')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ path: data.path })
}

// DELETE /api/admin/lesson-upload
// Body: { filePath: string }
export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { filePath } = await request.json()
  if (!filePath) return NextResponse.json({ error: 'Missing filePath' }, { status: 400 })

  const serviceClient = createServiceClient()
  await serviceClient.storage.from('product-files').remove([filePath])
  return NextResponse.json({ success: true })
}
