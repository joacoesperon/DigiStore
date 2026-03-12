'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import LicensePlanForm from './LicensePlanForm'
import type { LicensePlan } from '@/types'
import type { LicensePlanFormValues } from '@/lib/utils/validators'
import { formatCurrency } from '@/lib/utils/formatters'

interface PlansManagerProps {
  productId: string
  initialPlans: LicensePlan[]
  onCreatePlan: (productId: string, values: LicensePlanFormValues) => Promise<{ error?: string; data?: LicensePlan }>
  onUpdatePlan: (planId: string, values: LicensePlanFormValues) => Promise<{ error?: string }>
  onDeletePlan: (planId: string) => Promise<{ error?: string }>
}

const TYPE_LABELS: Record<string, string> = {
  perpetual: 'Perpetuo',
  subscription: 'Suscripción',
  trial: 'Trial',
}

export default function PlansManager({
  productId,
  initialPlans,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
}: PlansManagerProps) {
  const [plans, setPlans] = useState<LicensePlan[]>(initialPlans)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleCreate(values: LicensePlanFormValues) {
    const priceInCents = Math.round(values.price * 100)
    const result = await onCreatePlan(productId, { ...values, price: priceInCents })
    if (!result.error && result.data) {
      setPlans((prev) => [...prev, result.data!])
      setShowCreateForm(false)
    }
    return result
  }

  async function handleUpdate(planId: string, values: LicensePlanFormValues) {
    const priceInCents = Math.round(values.price * 100)
    const result = await onUpdatePlan(planId, { ...values, price: priceInCents })
    if (!result.error) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? {
                ...p,
                ...values,
                price: priceInCents,
                features: values.features as unknown as import('@/types/database').Json,
              }
            : p
        )
      )
      setEditingId(null)
    }
    return result
  }

  function handleDelete(planId: string) {
    startTransition(async () => {
      const result = await onDeletePlan(planId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setPlans((prev) => prev.filter((p) => p.id !== planId))
        toast.success('Plan eliminado')
      }
    })
  }

  return (
    <div className="space-y-4">
      {plans.length === 0 && !showCreateForm && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Este producto no tiene planes de licencia aún.
        </p>
      )}

      {plans.map((plan) => (
        <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
          {editingId === plan.id ? (
            <CardContent className="pt-6">
              <LicensePlanForm
                plan={plan}
                onSubmit={(values) => handleUpdate(plan.id, values)}
                onCancel={() => setEditingId(null)}
              />
            </CardContent>
          ) : (
            <>
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[plan.type]}
                    </Badge>
                    {!plan.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {plan.price === 0 ? 'Gratis' : formatCurrency(plan.price)}
                  </p>
                  {plan.billing_interval && (
                    <p className="text-xs text-muted-foreground">
                      /{plan.billing_interval === 'month' ? 'mes' : 'año'}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span>{plan.max_activations} activación{plan.max_activations !== 1 ? 'es' : ''}</span>
                  {plan.trial_days && <span>{plan.trial_days} días de prueba</span>}
                </div>
                {Array.isArray(plan.features) && (plan.features as string[]).length > 0 && (
                  <ul className="text-sm space-y-1 mb-3">
                    {(plan.features as string[]).map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                )}
                <Separator className="my-3" />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(plan.id)}
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(plan.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      ))}

      {showCreateForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevo plan</CardTitle>
          </CardHeader>
          <CardContent>
            <LicensePlanForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="h-4 w-4" />
          Agregar plan
        </Button>
      )}
    </div>
  )
}
