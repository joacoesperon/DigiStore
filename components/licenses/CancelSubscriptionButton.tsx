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
import { formatDate } from '@/lib/utils/formatters'

interface Props {
  licenseId: string
  cancelAtPeriodEnd: boolean
  expiresAt: string | null
}

export default function CancelSubscriptionButton({
  licenseId,
  cancelAtPeriodEnd,
  expiresAt,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAction(action: 'cancel' | 'reactivate') {
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong')
        return
      }
      if (action === 'cancel') {
        toast.success('Subscription cancelled. You keep access until the end of the billing period.')
      } else {
        toast.success('Subscription reactivated.')
      }
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (cancelAtPeriodEnd) {
    // Already scheduled for cancellation — show "Keep subscription" button
    return (
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => handleAction('reactivate')}
      >
        {loading ? 'Updating…' : 'Keep subscription'}
      </Button>
    )
  }

  // Active subscription — show Cancel button with confirmation dialog
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
          Cancel subscription
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
          <AlertDialogDescription>
            Your subscription will not renew after{' '}
            <strong>{expiresAt ? formatDate(expiresAt) : 'the current period ends'}</strong>.
            You&apos;ll keep full access until then.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Never mind</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => handleAction('cancel')}
            disabled={loading}
          >
            {loading ? 'Cancelling…' : 'Yes, cancel subscription'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
