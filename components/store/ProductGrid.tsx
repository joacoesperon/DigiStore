import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/formatters'

// Product type that works with both the full schema (after supabase gen types)
// and the current placeholder types
interface ProductLike {
  id: string
  name: string
  slug: string
  type: 'ebook' | 'course' | 'software' | 'template'
  thumbnail_url?: string | null
  short_description?: string | null
  // Available after running 001_initial_schema.sql migration
  price?: number
  compare_at_price?: number | null
  // From license_plans join (legacy)
  license_plans?: Array<{ price: number; is_active: boolean }>
}

const TYPE_LABELS: Record<string, string> = {
  ebook: 'Ebook',
  course: 'Curso',
  software: 'Software',
  template: 'Plantilla',
}

const TYPE_EMOJI: Record<string, string> = {
  ebook: '📖',
  course: '🎓',
  software: '🛠',
  template: '🎨',
}

function getDisplayPrice(product: ProductLike): string | null {
  // Our new schema: price field directly on product
  if (typeof product.price === 'number') {
    return product.price === 0 ? 'Gratis' : formatCurrency(product.price)
  }
  // Legacy: from license_plans
  if (product.license_plans && product.license_plans.length > 0) {
    const activePlans = product.license_plans.filter((p) => p.is_active)
    if (activePlans.length > 0) {
      const lowestPrice = Math.min(...activePlans.map((p) => p.price))
      return lowestPrice === 0 ? 'Gratis' : `Desde ${formatCurrency(lowestPrice)}`
    }
  }
  return null
}

interface ProductGridProps {
  products: ProductLike[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No hay productos disponibles todavía.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => {
        const displayPrice = getDisplayPrice(product)

        return (
          <Link key={product.id} href={`/products/${product.slug}`} className="group">
            <Card className="overflow-hidden h-full transition-shadow hover:shadow-md">
              {/* Thumbnail */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {product.thumbnail_url ? (
                  <Image
                    src={product.thumbnail_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    {TYPE_EMOJI[product.type] ?? '📦'}
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {TYPE_LABELS[product.type] ?? product.type}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {product.short_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.short_description}
                  </p>
                )}
                {displayPrice && (
                  <div className="font-semibold text-right">
                    {displayPrice}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
