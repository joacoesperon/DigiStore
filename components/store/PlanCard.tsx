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
}

const PLAN_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  perpetual: { label: 'One-time', variant: 'default' },
  subscription: { label: 'Subscription', variant: 'secondary' },
  trial: { label: 'Free Trial', variant: 'outline' },
}

export default function PlanCard({ plan, onSelect, isSelected, isPurchasing, isOwned }: PlanCardProps) {
  const badge = PLAN_BADGE[plan.type] ?? { label: plan.type, variant: 'outline' as const }
  const features = Array.isArray(plan.features) ? (plan.features as string[]) : []

  const intervalLabel = plan.billing_interval === 'year' ? '/yr' : '/mo'
  const priceLabel =
    plan.price === 0
      ? 'Free'
      : plan.type === 'subscription'
        ? `${formatCurrency(plan.price)}${intervalLabel}`
        : formatCurrency(plan.price)

  const buttonLabel = (() => {
    if (isPurchasing && isSelected) return 'Processing…'
    if (plan.type === 'trial') return plan.trial_days ? `Start free trial — ${plan.trial_days} days` : 'Start free trial'
    if (plan.price === 0) return 'Get for free'
    if (plan.type === 'subscription') return `Subscribe — ${formatCurrency(plan.price)}${intervalLabel}`
    return `Buy now — ${formatCurrency(plan.price)}`
  })()

  const cardClass = isOwned
    ? 'flex flex-col transition-all border-green-500 ring-1 ring-green-500'
    : `flex flex-col transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : ''}`

  return (
    <Card className={cardClass}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          {isOwned
            ? <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Active</Badge>
            : <Badge variant={badge.variant}>{badge.label}</Badge>
          }
        </div>
        <CardDescription>
          <span className="text-2xl font-bold text-foreground">{priceLabel}</span>
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
