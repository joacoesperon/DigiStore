import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import PlanSelector from '@/components/store/PlanSelector'
import ReviewForm from '@/components/store/ReviewForm'
import { PRODUCT_TYPE_LABELS } from '@/types'
import type { Product, LicensePlan } from '@/types'
import { formatDate } from '@/lib/utils/formatters'
import { Star } from 'lucide-react'

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
  let usedTrialPlanIds: string[] = []
  if (user) {
    const now = new Date().toISOString()
    const { data: activeLicenses } = await supabase
      .from('licenses')
      .select('license_plan_id')
      .eq('user_id', user.id)
      .eq('product_id', p.id)
      .in('status', ['active', 'trial'])
      .or(`expires_at.is.null,expires_at.gt.${now}`)
    ownedPlanIds = activeLicenses?.map((l) => l.license_plan_id) ?? []

    // Trials que ya se usaron alguna vez (cualquier status, incluyendo revoked/expired)
    const { data: trialLicenses } = await supabase
      .from('licenses')
      .select('license_plan_id')
      .eq('user_id', user.id)
      .eq('product_id', p.id)
      .eq('type', 'trial')
    usedTrialPlanIds = trialLicenses?.map((l) => l.license_plan_id) ?? []
  }

  const { data: approvedReviews } = await supabase
    .from('reviews')
    .select('id, rating, title, body, created_at')
    .eq('product_id', p.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  let hasLicense = false
  let myReview: { id: string } | null = null
  if (user) {
    const { data: licenseCheck } = await supabase
      .from('licenses')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', p.id)
      .limit(1)
      .maybeSingle()
    hasLicense = !!licenseCheck

    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', p.id)
      .maybeSingle()
    myReview = existingReview
  }

  const canReview = !!user && hasLicense && !myReview

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
      <PlanSelector plans={p.license_plans} productId={p.id} ownedPlanIds={ownedPlanIds} usedTrialPlanIds={usedTrialPlanIds} />

      <Separator className="my-10" />

      {/* Reviews */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Reviews</h2>

        {(approvedReviews ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground mb-8">No reviews yet.</p>
        ) : (
          <div className="space-y-6 mb-10">
            {(approvedReviews ?? []).map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-4 w-4 ${n <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">{formatDate(review.created_at)}</span>
                </div>
                {review.title && <p className="text-sm font-medium mb-1">{review.title}</p>}
                {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
              </div>
            ))}
          </div>
        )}

        {canReview && (
          <div>
            <h3 className="text-base font-semibold mb-4">Write a review</h3>
            <ReviewForm productId={p.id} />
          </div>
        )}
        {user && myReview && (
          <p className="text-sm text-muted-foreground">You already reviewed this product.</p>
        )}
      </div>
    </div>
  )
}
