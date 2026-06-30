'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface SuspendButtonProps {
  licenseId: string
  isSuspended: boolean
}

export default function SuspendButton({ licenseId, isSuspended }: SuspendButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}/suspend`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed')
        return
      }
      toast.success(isSuspended ? 'License reactivated' : 'License suspended')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle} disabled={loading}>
      {loading ? '...' : isSuspended ? 'Reactivate' : 'Suspend'}
    </Button>
  )
}
