import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import PlanSelector from '@/components/store/PlanSelector'
import { PRODUCT_TYPE_LABELS } from '@/types'
import type { Product, LicensePlan } from '@/types'

type ProductWithPlans = Product & { license_plans: LicensePlan[] }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, short_description')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!product) return { title: 'Product not found' }
  return {
    title: product.name,
    description: product.short_description ?? undefined,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, license_plans(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!product) notFound()

  const p = product as ProductWithPlans

  // Obtener qué planes ya posee el usuario (licencias activas/trial)
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  let ownedPlanIds: string[] = []
  if (user) {
    const { data: licenses } = await supabase
      .from('licenses')
      .select('license_plan_id')
      .eq('user_id', user.id)
      .eq('product_id', p.id)
      .in('status', ['active', 'trial'])
    ownedPlanIds = licenses?.map((l) => l.license_plan_id) ?? []
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        {/* Thumbnail */}
        <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
          {p.thumbnail_url ? (
            <Image
              src={p.thumbnail_url}
              alt={p.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl">
              {p.type === 'software' ? '🛠' : p.type === 'ebook' ? '📖' : p.type === 'course' ? '🎓' : '🎨'}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <Badge variant="secondary" className="mb-3">
            {PRODUCT_TYPE_LABELS[p.type]}
          </Badge>
          <h1 className="text-3xl font-bold mb-3">{p.name}</h1>
          {p.short_description && (
            <p className="text-muted-foreground mb-4">{p.short_description}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {p.description && (
        <>
          <Separator className="mb-8" />
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">About this product</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
              {p.description}
            </div>
          </div>
        </>
      )}

      <Separator className="mb-8" />

      {/* Plans */}
      <PlanSelector plans={p.license_plans} productId={p.id} ownedPlanIds={ownedPlanIds} />
    </div>
  )
}
