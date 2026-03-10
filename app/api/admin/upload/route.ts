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

// GET /api/admin/upload?filePath=... — genera una URL firmada para descargar
export async function GET(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('filePath')
  if (!filePath) return NextResponse.json({ error: 'Missing filePath' }, { status: 400 })

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient.storage
    .from('product-files')
    .createSignedUrl(filePath, 60) // válido 60 segundos

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ url: data.signedUrl })
}

// POST /api/admin/upload — sube un archivo al bucket product-files
export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const productId = formData.get('productId') as string | null
  const currentFilePath = formData.get('currentFilePath') as string | null

  if (!file || !productId) {
    return NextResponse.json({ error: 'Missing file or productId' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Eliminar archivo anterior si existe
  if (currentFilePath) {
    await serviceClient.storage.from('product-files').remove([currentFilePath])
  }

  const path = `${productId}/${file.name}`
  const arrayBuffer = await file.arrayBuffer()

  const { data, error } = await serviceClient.storage
    .from('product-files')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ path: data.path })
}

// DELETE /api/admin/upload — elimina un archivo del bucket
export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { filePath } = await request.json()
  if (!filePath) return NextResponse.json({ error: 'Missing filePath' }, { status: 400 })

  const serviceClient = createServiceClient()
  await serviceClient.storage.from('product-files').remove([filePath])
  return NextResponse.json({ success: true })
}
