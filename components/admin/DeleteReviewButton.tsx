'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

export default function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function remove() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Review deleted')
    router.refresh()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          Reject
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this review?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the review. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={remove} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
