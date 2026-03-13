import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, PackageIcon, Pencil, LayoutList, BookOpen } from 'lucide-react'
import { PRODUCT_TYPE_LABELS } from '@/types'
import type { Product } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-50 text-green-700 border-green-200',
  draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  archived: 'bg-gray-50 text-gray-600 border-gray-200',
}

const STATUS_LABELS: Record<string, string> = {
  published: 'Publicado',
  draft: 'Borrador',
  archived: 'Archivado',
}

export default async function AdminProductsPage() {
  const supabase = createServiceClient()

  const { data: products } = await supabase
    .from('products')
    .select('*, license_plans(count)')
    .order('created_at', { ascending: false })

  const items = (products ?? []) as (Product & { license_plans: { count: number }[] })[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Gestiona el catálogo de productos</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border rounded-lg">
          <PackageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay productos aún.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/products/new">Crear primer producto</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Planes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((product) => {
                const planCount = product.license_plans?.[0]?.count ?? 0
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {PRODUCT_TYPE_LABELS[product.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLORS[product.status]}`}>
                        {STATUS_LABELS[product.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {planCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {product.type === 'course' && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/products/${product.id}/curriculum`}>
                              <BookOpen className="h-4 w-4" />
                              Curriculum
                            </Link>
                          </Button>
                        )}
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/products/${product.id}/plans`}>
                            <LayoutList className="h-4 w-4" />
                            Planes
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
