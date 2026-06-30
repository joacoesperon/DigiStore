'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

export default function ApproveReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function approve() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', reviewId)
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Review approved')
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={approve} disabled={loading} className="h-7 text-xs gap-1">
      <Check className="h-3.5 w-3.5" />
      {loading ? '...' : 'Approve'}
    </Button>
  )
}
