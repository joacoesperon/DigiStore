import { createServiceClient } from '@/lib/supabase/server'
import ProductCard from '@/components/store/ProductCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Product, LicensePlan, ProductType } from '@/types'
import { PRODUCT_TYPE_LABELS } from '@/types'

type ProductWithPlans = Product & { license_plans: LicensePlan[] }

const ALL_TYPES: ProductType[] = ['software', 'ebook', 'course', 'template']

interface SearchParams {
  type?: string
  q?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { type, q } = await searchParams
  const supabase = createServiceClient()

  let query = supabase
    .from('products')
    .select('*, license_plans(*)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (type && ALL_TYPES.includes(type as ProductType)) {
    query = query.eq('type', type as ProductType)
  }

  if (q && q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`)
  }

  const { data: products } = await query
  const items = (products ?? []) as ProductWithPlans[]

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Products</h1>
        <p className="text-muted-foreground">Browse all available digital products and license plans.</p>
      </div>

      {/* Search */}
      <form method="get" action="/products" className="mb-6 flex gap-2 max-w-sm">
        {type && <input type="hidden" name="type" value={type} />}
        <Input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search products..."
        />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {/* Type filter */}
      <div className="mb-8 flex gap-1 flex-wrap">
        {[{ value: 'all', label: 'All' }, ...ALL_TYPES.map((t) => ({ value: t, label: PRODUCT_TYPE_LABELS[t] }))].map(({ value, label }) => {
          const href = value === 'all'
            ? `/products${q ? `?q=${encodeURIComponent(q)}` : ''}`
            : `/products?type=${value}${q ? `&q=${encodeURIComponent(q)}` : ''}`
          const active = (value === 'all' && !type) || value === type
          return (
            <a
              key={value}
              href={href}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-background text-foreground shadow-sm border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {label}
            </a>
          )
        })}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
