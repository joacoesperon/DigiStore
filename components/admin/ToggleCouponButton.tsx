'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function ToggleCouponButton({
  couponId,
  isActive,
}: {
  couponId: string
  isActive: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !isActive })
      .eq('id', couponId)
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(isActive ? 'Coupon deactivated' : 'Coupon activated')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} disabled={loading} className="h-7 text-xs">
      {loading ? '...' : isActive ? 'Deactivate' : 'Activate'}
    </Button>
  )
}
