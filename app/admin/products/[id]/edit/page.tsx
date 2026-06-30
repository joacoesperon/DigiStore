import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import ProductForm from '@/components/admin/ProductForm'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import type { ProductFormValues } from '@/lib/utils/validators'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) notFound()

  async function updateProduct(values: ProductFormValues, filePath: string | null): Promise<{ error?: string }> {
    'use server'
    const adminClient = createAdminClient()
    const thumbnailUrl = values.thumbnail_url === '' ? null : values.thumbnail_url

    const { error } = await adminClient
      .from('products')
      .update({
        name: values.name,
        slug: values.slug,
        description: values.description ?? null,
        short_description: values.short_description ?? null,
        type: values.type,
        status: values.status,
        thumbnail_url: thumbnailUrl ?? null,
        file_path: filePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      if (error.code === '23505') {
        return { error: 'Ya existe un producto con ese slug' }
      }
      return { error: error.message }
    }

    return {}
  }

  async function deleteProduct(): Promise<{ error?: string }> {
    'use server'
    const adminClient = createAdminClient()

    // 1. Licencias del producto y sus IDs
    const { data: licenses } = await adminClient
      .from('licenses')
      .select('id')
      .eq('product_id', id)

    const licenseIds = (licenses ?? []).map((l) => l.id)

    if (licenseIds.length > 0) {
      await adminClient.from('license_activations').delete().in('license_id', licenseIds)
      await adminClient.from('license_events').delete().in('license_id', licenseIds)
      await adminClient.from('licenses').delete().in('id', licenseIds)
    }

    // 2. Order items y órdenes huérfanas
    const { data: orderItems } = await adminClient
      .from('order_items')
      .select('id, order_id')
      .eq('product_id', id)

    if (orderItems && orderItems.length > 0) {
      const orderIds = [...new Set(orderItems.map((oi) => oi.order_id))]
      await adminClient.from('order_items').delete().eq('product_id', id)
      for (const orderId of orderIds) {
        const { count } = await adminClient
          .from('order_items')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', orderId)
        if (!count || count === 0) {
          await adminClient.from('orders').delete().eq('id', orderId)
        }
      }
    }

    // 3. Planes del producto
    await adminClient.from('license_plans').delete().eq('product_id', id)

    // 4. Archivo en storage (si existe)
    const serviceClient = createServiceClient()
    const { data: productData } = await serviceClient
      .from('products')
      .select('file_path')
      .eq('id', id)
      .single()
    if (productData?.file_path) {
      await adminClient.storage.from('product-files').remove([productData.file_path])
    }

    // 5. Producto
    const { error } = await adminClient.from('products').delete().eq('id', id)
    if (error) return { error: error.message }

    redirect('/admin/products')
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <h1 className="text-2xl font-bold">Editar producto</h1>
        <p className="text-muted-foreground text-sm">{product.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm product={product} onSubmit={updateProduct} />
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <div className="rounded-lg border border-destructive/30 p-4 bg-destructive/5">
        <p className="text-sm font-medium text-destructive mb-1">Zona de peligro</p>
        <p className="text-xs text-muted-foreground mb-3">
          Eliminar este producto borrará todos sus planes, licencias, activaciones y órdenes asociadas. Esta acción no se puede deshacer.
        </p>
        <DeleteProductButton productName={product.name} onDelete={deleteProduct} />
      </div>
    </div>
  )
}
