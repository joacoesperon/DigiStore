import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SIGNED_URL_EXPIRES_IN = 60 * 60 // 1 hour

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params

  // 1. Authenticate user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // 2. Get product file_path
  const { data: product } = await admin
    .from('products')
    .select('id, name, file_path, status')
    .eq('id', productId)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (!product.file_path) {
    return NextResponse.json({ error: 'No file available for this product' }, { status: 404 })
  }

  // 3. Verify user has an active license for this product
  const { data: license } = await admin
    .from('licenses')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .in('status', ['active', 'trial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!license) {
    return NextResponse.json(
      { error: 'No active license found for this product' },
      { status: 403 }
    )
  }

  // 4. Generate signed URL (expires in 1 hour)
  const { data: signedData, error: signError } = await admin.storage
    .from('product-files')
    .createSignedUrl(product.file_path, SIGNED_URL_EXPIRES_IN, {
      download: true, // forces browser to download instead of preview
    })

  if (signError || !signedData?.signedUrl) {
    console.error('Signed URL error:', signError)
    return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
  }

  // 5. Log the download event (best effort)
  await admin.from('license_events').insert({
    license_id: license.id,
    event_type: 'verified',
    metadata: { action: 'file_download', product_id: productId },
  }).then(() => {})

  // 6. Redirect to the signed URL
  return NextResponse.redirect(signedData.signedUrl)
}
