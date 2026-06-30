'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils/formatters'
import { Monitor, Trash2 } from 'lucide-react'
import type { LicenseActivation } from '@/types'

interface ActivationListProps {
  activations: LicenseActivation[]
  licenseKey: string
  canDeactivate: boolean
}

export default function ActivationList({ activations, licenseKey, canDeactivate }: ActivationListProps) {
  const router = useRouter()
  const [deactivating, setDeactivating] = useState<string | null>(null)

  const active = activations.filter((a) => a.is_active)

  async function handleDeactivate(machineId: string) {
    setDeactivating(machineId)
    try {
      const res = await fetch('/api/v1/licenses/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: licenseKey, machine_id: machineId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to deactivate')
        return
      }
      toast.success('Machine deactivated')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setDeactivating(null)
    }
  }

  if (active.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No active activations yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {active.map((activation) => (
        <div
          key={activation.id}
          className="flex items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {activation.machine_name ?? activation.machine_id}
              </p>
              <p className="text-xs text-muted-foreground">
                Last seen: {formatDateTime(activation.last_seen_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs">Active</Badge>
            {canDeactivate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => handleDeactivate(activation.machine_id)}
                disabled={deactivating === activation.machine_id}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
