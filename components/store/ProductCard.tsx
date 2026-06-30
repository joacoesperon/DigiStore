import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/formatters'
import { PRODUCT_TYPE_LABELS } from '@/types'
import type { Product, LicensePlan } from '@/types'

type ProductWithPlans = Product & { license_plans: LicensePlan[] }

interface ProductCardProps {
  product: ProductWithPlans
}

export default function ProductCard({ product }: ProductCardProps) {
  const activePlans = product.license_plans.filter((p) => p.is_active)
  const lowestPrice = activePlans.length > 0
    ? Math.min(...activePlans.map((p) => p.price))
    : null

  return (
    <Link href={`/products/${product.slug}`} className="group">
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
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-4xl">
              {product.type === 'software' ? '🛠' : product.type === 'ebook' ? '📖' : product.type === 'course' ? '🎓' : '🎨'}
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {PRODUCT_TYPE_LABELS[product.type]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {product.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {product.short_description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {activePlans.length > 0 ? `${activePlans.length} plan${activePlans.length > 1 ? 's' : ''}` : 'No plans'}
            </span>
            {lowestPrice !== null && (
              <span className="font-semibold">
                {lowestPrice === 0 ? 'Free' : `From ${formatCurrency(lowestPrice)}`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
