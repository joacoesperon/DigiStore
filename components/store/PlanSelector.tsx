'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import PlanCard from './PlanCard'
import type { LicensePlan } from '@/types'

interface PlanSelectorProps {
  plans: LicensePlan[]
  productId: string
  ownedPlanIds?: string[]
  usedTrialPlanIds?: string[]
}

export default function PlanSelector({ plans, productId, ownedPlanIds = [], usedTrialPlanIds = [] }: PlanSelectorProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const router = useRouter()

  const activePlans = plans.filter((p) => p.is_active)

  async function handlePurchase() {
    if (!selectedPlanId) {
      toast.error('Please select a plan first')
      return
    }

    setIsPurchasing(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, planId: selectedPlanId }),
      })

      if (res.status === 401) {
        toast.error('Please sign in to purchase')
        router.push(`/auth/login?redirectTo=/products`)
        return
      }

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'You already have an active license for this plan')
        router.push('/dashboard/licenses')
        return
      }

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Checkout failed')
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else if (data.licenseKey) {
        const msg = data.planType === 'trial' ? 'Trial activated!' : 'Product unlocked!'
        toast.success(msg)
        router.push('/dashboard/licenses')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsPurchasing(false)
    }
  }

  function handleSelect(planId: string) {
    if (ownedPlanIds.includes(planId)) return
    if (usedTrialPlanIds.includes(planId)) return
    setSelectedPlanId(planId)
  }

  if (activePlans.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No plans available at the moment.</p>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Choose a plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSelect={handleSelect}
            isSelected={selectedPlanId === plan.id}
            isPurchasing={isPurchasing}
            isOwned={ownedPlanIds.includes(plan.id)}
            isTrialUsed={usedTrialPlanIds.includes(plan.id) && !ownedPlanIds.includes(plan.id)}
          />
        ))}
      </div>
      {selectedPlanId && !ownedPlanIds.includes(selectedPlanId) && !usedTrialPlanIds.includes(selectedPlanId) && (
        <div className="flex justify-end">
          <button
            onClick={handlePurchase}
            disabled={isPurchasing}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
          >
            {isPurchasing ? 'Processing…' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  )
}
