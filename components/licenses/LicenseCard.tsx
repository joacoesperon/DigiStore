import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/formatters'
import { LICENSE_STATUS_LABELS, LICENSE_STATUS_COLORS } from '@/types'
import type { LicenseWithProduct } from '@/types'
import { Monitor, Calendar, Download, BookOpen, ArrowRight } from 'lucide-react'

interface LicenseCardProps {
  license: LicenseWithProduct
}

const PRODUCT_TYPE_ICON: Record<string, React.ReactNode> = {
  software: <Monitor className="h-3.5 w-3.5" />,
  ebook: <Download className="h-3.5 w-3.5" />,
  template: <Download className="h-3.5 w-3.5" />,
  course: <BookOpen className="h-3.5 w-3.5" />,
}

const PRODUCT_TYPE_HINT: Record<string, string> = {
  software: 'activations',
  ebook: 'download available',
  template: 'download available',
  course: 'course access',
}

export default function LicenseCard({ license }: LicenseCardProps) {
  const statusLabel = LICENSE_STATUS_LABELS[license.status] ?? license.status
  const statusColor = LICENSE_STATUS_COLORS[license.status] ?? ''
  const productType = license.products.type ?? 'software'

  const hint = productType === 'software'
    ? `${license.activation_count} / ${license.max_activations} activations`
    : PRODUCT_TYPE_HINT[productType] ?? ''

  const isSubscription = license.type === 'subscription'
  const isActive = license.status === 'active'
  const expiresLabel =
    isSubscription && isActive && !license.cancel_at_period_end
      ? 'Renews'
      : isSubscription && license.cancel_at_period_end
      ? 'Cancels'
      : 'Expires'

  return (
    <Link href={`/dashboard/licenses/${license.id}`} className="group">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
              {license.products.name}
            </CardTitle>
            <Badge variant="outline" className={`shrink-0 text-xs ${statusColor}`}>
              {statusLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{license.license_plans.name} · {license.license_plans.type}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {PRODUCT_TYPE_ICON[productType]}
            <span>{hint}</span>
          </div>
          {license.expires_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className={license.cancel_at_period_end ? 'text-orange-600' : ''}>
                {expiresLabel} {formatDate(license.expires_at)}
              </span>
            </div>
          )}
          <div className="flex justify-end pt-1">
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
