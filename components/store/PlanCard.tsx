import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/formatters'
import { Check } from 'lucide-react'
import type { LicensePlan } from '@/types'

interface PlanCardProps {
  plan: LicensePlan
  onSelect: (planId: string) => void
  isSelected?: boolean
  isPurchasing?: boolean
  isOwned?: boolean
  isTrialUsed?: boolean
}

const PLAN_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  perpetual: { label: 'One-time', variant: 'default' },
  subscription: { label: 'Subscription', variant: 'secondary' },
  trial: { label: 'Free Trial', variant: 'outline' },
}

export default function PlanCard({ plan, onSelect, isSelected, isPurchasing, isOwned, isTrialUsed }: PlanCardProps) {
  const badge = PLAN_BADGE[plan.type] ?? { label: plan.type, variant: 'outline' as const }
  const features = Array.isArray(plan.features) ? (plan.features as string[]) : []

  const intervalLabel = plan.billing_interval === 'year' ? '/yr' : '/mo'
  const hasStripeTrial = plan.type === 'subscription' && !!plan.trial_days && plan.trial_days > 0

  const priceLabel =
    plan.price === 0 ? 'Free'
    : hasStripeTrial ? `Free for ${plan.trial_days} days`
    : plan.type === 'subscription' ? `${formatCurrency(plan.price)}${intervalLabel}`
    : formatCurrency(plan.price)

  const priceSublabel = hasStripeTrial ? `then ${formatCurrency(plan.price)}${intervalLabel}` : null

  const buttonLabel = (() => {
    if (isPurchasing && isSelected) return 'Processing…'
    if (hasStripeTrial) return `Start ${plan.trial_days}-day free trial`
    if (plan.type === 'trial') return plan.trial_days ? `Start free trial — ${plan.trial_days} days` : 'Start free trial'
    if (plan.price === 0) return 'Get for free'
    if (plan.type === 'subscription') return `Subscribe — ${formatCurrency(plan.price)}${intervalLabel}`
    return `Buy now — ${formatCurrency(plan.price)}`
  })()

  const displayBadge = hasStripeTrial ? { label: 'Free Trial', variant: 'outline' as const } : badge

  const cardClass = isOwned
    ? 'flex flex-col transition-all border-green-500 ring-1 ring-green-500'
    : isTrialUsed
    ? 'flex flex-col transition-all opacity-60'
    : `flex flex-col transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : ''}`

  return (
    <Card className={cardClass}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          {isOwned
            ? <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Active</Badge>
            : isTrialUsed
            ? <Badge variant="secondary" className="text-muted-foreground">Trial used</Badge>
            : <Badge variant={displayBadge.variant}>{displayBadge.label}</Badge>
          }
        </div>
        <CardDescription>
          <span className="text-2xl font-bold text-foreground">{priceLabel}</span>
          {priceSublabel && <span className="text-sm text-muted-foreground ml-2">{priceSublabel}</span>}
        </CardDescription>
      </CardHeader>

      {features.length > 0 && (
        <CardContent className="flex-1">
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Up to {plan.max_activations} device{plan.max_activations > 1 ? 's' : ''}
            {plan.type === 'trial' && plan.trial_days ? ` · ${plan.trial_days}-day trial` : ''}
          </p>
        </CardContent>
      )}

      <CardFooter>
        {isOwned ? (
          <Button className="w-full" variant="secondary" asChild>
            <Link href="/dashboard/licenses">Manage license →</Link>
          </Button>
        ) : isTrialUsed ? (
          <Button className="w-full" variant="outline" disabled>
            Trial already used
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => onSelect(plan.id)}
            disabled={isPurchasing}
          >
            {buttonLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
