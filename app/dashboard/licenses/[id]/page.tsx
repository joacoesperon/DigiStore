import { notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import LicenseKeyDisplay from '@/components/licenses/LicenseKeyDisplay'
import ActivationList from '@/components/licenses/ActivationList'
import CancelSubscriptionButton from '@/components/licenses/CancelSubscriptionButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatDateTime } from '@/lib/utils/formatters'
import { LICENSE_STATUS_LABELS, LICENSE_STATUS_COLORS } from '@/types'
import type { LicenseWithActivations } from '@/types'
import { Monitor, Calendar, Package, ArrowLeft, Download, PlayCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type ProductType = 'software' | 'ebook' | 'course' | 'template'

export default async function LicenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const serviceClient = createServiceClient()
  const { data } = await serviceClient
    .from('licenses')
    .select(`
      *,
      products(id, name, slug, thumbnail_url, file_path, type),
      license_plans(id, name, type, max_activations),
      license_activations(*)
    `)
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!data) notFound()

  const license = data as unknown as LicenseWithActivations & {
    products: { file_path: string | null; type: ProductType; slug: string }
    cancel_at_period_end: boolean
  }

  const productType: ProductType = license.products.type
  const isSoftware = productType === 'software'
  const isCourse = productType === 'course'
  const isDownloadable = productType === 'ebook' || productType === 'template'
  const isSubscription = license.type === 'subscription'

  const statusLabel = LICENSE_STATUS_LABELS[license.status] ?? license.status
  const statusColor = LICENSE_STATUS_COLORS[license.status] ?? ''
  const isActive = license.status === 'active' || license.status === 'trial'
  const hasFile = !!(license.products as unknown as { file_path: string | null }).file_path
  const canDownload = hasFile && isActive

  // For subscriptions: "Renews" if not scheduled to cancel, "Expires" if cancellation pending
  const expiresLabel =
    isSubscription && isActive && !license.cancel_at_period_end ? 'Renews' : 'Expires'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/licenses"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{license.products.name}</h1>
          <p className="text-sm text-muted-foreground">{license.license_plans.name}</p>
        </div>
        <Badge variant="outline" className={`ml-auto shrink-0 ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Subscription cancellation banner */}
      {isSubscription && license.cancel_at_period_end && license.expires_at && (
        <div className="flex items-start gap-3 rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Your subscription is scheduled to cancel on{' '}
            <strong>{formatDate(license.expires_at)}</strong>.
            You&apos;ll keep full access until then.
          </p>
        </div>
      )}

      {/* Course: Go to course button */}
      {isCourse && isActive && (
        <Button asChild size="lg" className="w-full sm:w-auto gap-2">
          <Link href={`/dashboard/courses/${license.product_id}`}>
            <PlayCircle className="h-4 w-4" />
            Go to course
          </Link>
        </Button>
      )}

      {/* Software / Ebook / Template: Download button */}
      {(isSoftware || isDownloadable) && canDownload && (
        <Button asChild size="lg" className="w-full sm:w-auto gap-2">
          <a href={`/api/downloads/${license.product_id}`}>
            <Download className="h-4 w-4" />
            Download product
          </a>
        </Button>
      )}

      {/* Software only: License key */}
      {isSoftware && (
        <LicenseKeyDisplay licenseKey={license.license_key} status={license.status} />
      )}

      {/* License details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">License Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Plan</span>
            <span className="ml-auto font-medium capitalize">
              {license.license_plans.name} · {license.license_plans.type}
            </span>
          </div>

          {/* Activations only for software */}
          {isSoftware && (
            <>
              <Separator />
              <div className="flex items-center gap-3 text-sm">
                <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Activations</span>
                <span className="ml-auto font-medium">
                  {license.activation_count} / {license.max_activations}
                </span>
              </div>
            </>
          )}

          {license.expires_at && (
            <>
              <Separator />
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{expiresLabel}</span>
                <span className="ml-auto font-medium">{formatDate(license.expires_at)}</span>
              </div>
            </>
          )}
          <Separator />
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Issued</span>
            <span className="ml-auto font-medium">{formatDateTime(license.issued_at)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Cancel / reactivate subscription */}
      {isSubscription && isActive && (
        <CancelSubscriptionButton
          licenseId={license.id}
          cancelAtPeriodEnd={license.cancel_at_period_end}
          expiresAt={license.expires_at}
        />
      )}

      {/* Active Devices — software only */}
      {isSoftware && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Active Devices</h2>
          <ActivationList
            activations={license.license_activations}
            licenseKey={license.license_key}
            canDeactivate={isActive}
          />
        </div>
      )}
    </div>
  )
}

