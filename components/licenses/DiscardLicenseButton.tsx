'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'

interface Props {
  licenseId: string
}

export default function DiscardLicenseButton({ licenseId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDiscard() {
    setLoading(true)
    try {
      const res = await fetch(`/api/licenses/${licenseId}/discard`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong')
        return
      }
      toast.success('License discarded.')
      router.push('/dashboard/licenses')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-destructive text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          Discard license
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard this license?</AlertDialogTitle>
          <AlertDialogDescription>
            This license will be removed from your dashboard. You&apos;ll be able to
            get a new one for this plan if you need it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDiscard}
            disabled={loading}
          >
            {loading ? 'Discarding…' : 'Yes, discard it'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
