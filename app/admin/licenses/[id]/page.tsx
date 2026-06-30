import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatDateTime } from '@/lib/utils/formatters'
import { LICENSE_STATUS_LABELS, LICENSE_STATUS_COLORS } from '@/types'
import type { License, LicenseEvent, LicenseActivation, Product, LicensePlan, Profile } from '@/types'
import RevokeDialog from '@/components/admin/RevokeDialog'
import SuspendButton from '@/components/admin/SuspendButton'
import { ArrowLeft, Monitor, Calendar, UserCircle } from 'lucide-react'
import Link from 'next/link'

const EVENT_LABELS: Record<string, string> = {
  issued: 'Issued',
  activated: 'Activated',
  deactivated: 'Deactivated',
  verified: 'Verified',
  expired: 'Expired',
  revoked: 'Revoked',
  suspended: 'Suspended',
  renewed: 'Renewed',
  reactivated: 'Reactivated',
}

type LicenseFull = License & {
  products: Pick<Product, 'id' | 'name' | 'slug' | 'type'>
  license_plans: Pick<LicensePlan, 'id' | 'name' | 'type'>
  license_activations: LicenseActivation[]
  license_events: LicenseEvent[]
}

export default async function AdminLicenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('licenses')
    .select(`
      *,
      products(id, name, slug, type),
      license_plans(id, name, type),
      license_activations(*),
      license_events(*)
    `)
    .eq('id', id)
    .single()

  if (!data) notFound()

  const license = data as unknown as LicenseFull

  // Fetch license owner profile
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', license.user_id)
    .single()

  const owner = ownerProfile as Pick<Profile, 'id' | 'email' | 'full_name'> | null

  const statusLabel = LICENSE_STATUS_LABELS[license.status] ?? license.status
  const statusColor = LICENSE_STATUS_COLORS[license.status] ?? ''

  const activeActivations = license.license_activations.filter((a) => a.is_active)
  const events = [...(license.license_events ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const isSoftware = license.products.type === 'software'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/licenses" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-mono text-lg font-bold truncate">{license.license_key}</h1>
          <p className="text-sm text-muted-foreground">
            {license.products.name} · {license.license_plans.name}
          </p>
        </div>
        <Badge variant="outline" className={`shrink-0 ${statusColor}`}>{statusLabel}</Badge>
      </div>

      {/* Actions */}
      {license.status !== 'revoked' && (
        <div className="flex gap-2">
          <SuspendButton
            licenseId={license.id}
            isSuspended={license.status === 'suspended'}
          />
          <RevokeDialog licenseId={license.id} licenseKey={license.license_key} />
        </div>
      )}

      {/* Owner */}
      <Card>
        <CardHeader><CardTitle className="text-base">Owner</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              {owner?.full_name && (
                <p className="font-medium">{owner.full_name}</p>
              )}
              <p className="text-muted-foreground">{owner?.email ?? license.user_id}</p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-muted-foreground">{license.user_id}</span>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="capitalize">{license.type}</span>
          </div>
          {isSoftware && (
            <>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Activations</span>
                <span className="flex items-center gap-1">
                  <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                  {license.activation_count} / {license.max_activations}
                </span>
              </div>
            </>
          )}
          {license.expires_at && (
            <>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(license.expires_at)}
                </span>
              </div>
            </>
          )}
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Issued</span>
            <span>{formatDateTime(license.issued_at)}</span>
          </div>
          {license.revoked_at && (
            <>
              <Separator />
              <div className="flex justify-between text-destructive">
                <span>Revoked</span>
                <span>{formatDateTime(license.revoked_at)}</span>
              </div>
              {license.revocation_reason && (
                <p className="text-xs text-muted-foreground italic">{license.revocation_reason}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Devices — only for software */}
      {isSoftware && (
        <div>
          <h2 className="text-base font-semibold mb-3">Active Devices ({activeActivations.length})</h2>
          {activeActivations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active devices.</p>
          ) : (
            <div className="space-y-2">
              {activeActivations.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{a.machine_name ?? a.machine_id}</p>
                    <p className="text-xs text-muted-foreground">Last seen: {formatDateTime(a.last_seen_at)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{a.ip_address ?? ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event log */}
      <div>
        <h2 className="text-base font-semibold mb-3">Event History</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events.</p>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-medium">{EVENT_LABELS[ev.event_type] ?? ev.event_type}</span>
                  {ev.machine_id && (
                    <span className="text-muted-foreground"> · {ev.machine_id}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDateTime(ev.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
