import { Badge } from '@/components/ui/badge'
import { LICENSE_STATUS_LABELS, LICENSE_STATUS_COLORS } from '@/types'
import type { LicenseStatus } from '@/types'

export default function LicenseStatusBadge({ status }: { status: LicenseStatus }) {
  return (
    <Badge variant="outline" className={`text-xs font-medium ${LICENSE_STATUS_COLORS[status]}`}>
      {LICENSE_STATUS_LABELS[status]}
    </Badge>
  )
}
