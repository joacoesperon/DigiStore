import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProductForm from '@/components/admin/ProductForm'
import type { ProductFormValues } from '@/lib/utils/validators'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

async function createProduct(values: ProductFormValues, filePath: string | null): Promise<{ error?: string }> {
  'use server'
  const supabase = createAdminClient()

  const thumbnailUrl = values.thumbnail_url === '' ? null : values.thumbnail_url

  const { error } = await supabase.from('products').insert({
    name: values.name,
    slug: values.slug,
    description: values.description ?? null,
    short_description: values.short_description ?? null,
    type: values.type,
    status: values.status,
    thumbnail_url: thumbnailUrl ?? null,
    file_path: filePath ?? null,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe un producto con ese slug' }
    }
    return { error: error.message }
  }

  return {}
}

export default function NewProductPage() {
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
        <h1 className="text-2xl font-bold">Nuevo producto</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm onSubmit={createProduct} />
        </CardContent>
      </Card>
    </div>
  )
}
