'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EyeOff, Eye } from 'lucide-react'

interface HideLicenseButtonProps {
  licenseId: string
  hidden: boolean
}

export default function HideLicenseButton({ licenseId, hidden }: HideLicenseButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/licenses/${licenseId}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: !hidden }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(hidden ? 'License restored to dashboard' : 'License hidden from dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={loading} className="gap-2">
      {hidden ? (
        <>
          <Eye className="h-4 w-4" />
          Restore to dashboard
        </>
      ) : (
        <>
          <EyeOff className="h-4 w-4" />
          Hide from dashboard
        </>
      )}
    </Button>
  )
}
