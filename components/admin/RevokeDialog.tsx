'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface RevokeDialogProps {
  licenseId: string
  licenseKey: string
}

export default function RevokeDialog({ licenseId, licenseKey }: RevokeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRevoke() {
    if (!reason.trim()) {
      toast.error('Provide a revocation reason')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to revoke')
        return
      }
      toast.success('License revoked')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">Revoke</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke License</DialogTitle>
          <DialogDescription>
            This will permanently revoke <code className="font-mono text-xs">{licenseKey}</code>.
            The user will lose all access. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            placeholder="e.g. Policy violation, refund requested..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
            {loading ? 'Revoking...' : 'Revoke license'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
