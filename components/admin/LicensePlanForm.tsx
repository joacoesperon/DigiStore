'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { licensePlanSchema, type LicensePlanFormValues } from '@/lib/utils/validators'
import type { LicensePlan } from '@/types'
import { Trash2, Plus, X } from 'lucide-react'

interface LicensePlanFormProps {
  plan?: LicensePlan
  onSubmit: (values: LicensePlanFormValues) => Promise<{ error?: string }>
  onCancel: () => void
}

export default function LicensePlanForm({ plan, onSubmit, onCancel }: LicensePlanFormProps) {
  const [features, setFeatures] = useState<string[]>(
    Array.isArray(plan?.features) ? (plan.features as string[]) : []
  )
  const [newFeature, setNewFeature] = useState('')

  const form = useForm<LicensePlanFormValues>({
    resolver: zodResolver(licensePlanSchema) as Resolver<LicensePlanFormValues>,
    defaultValues: {
      name: plan?.name ?? '',
      type: plan?.type ?? 'perpetual',
      price: plan?.price ? plan.price / 100 : 0,
      currency: plan?.currency ?? 'usd',
      billing_interval: plan?.billing_interval ?? null,
      trial_days: plan?.trial_days ?? null,
      max_activations: plan?.max_activations ?? 1,
      features: Array.isArray(plan?.features) ? (plan.features as string[]) : [],
      is_active: plan?.is_active ?? true,
    },
  })

  const watchType = form.watch('type')

  function addFeature() {
    if (!newFeature.trim()) return
    const updated = [...features, newFeature.trim()]
    setFeatures(updated)
    form.setValue('features', updated)
    setNewFeature('')
  }

  function removeFeature(index: number) {
    const updated = features.filter((_, i) => i !== index)
    setFeatures(updated)
    form.setValue('features', updated)
  }

  async function handleSubmit(values: LicensePlanFormValues) {
    const result = await onSubmit({ ...values, features })
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(plan ? 'Plan actualizado' : 'Plan creado')
    onCancel()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del plan</FormLabel>
                <FormControl>
                  <Input placeholder="Pro, Starter, Enterprise…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="perpetual">Perpetuo</SelectItem>
                    <SelectItem value="subscription">Suscripción</SelectItem>
                    <SelectItem value="trial">Trial gratuito</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="29.99"
                    {...field}
                    disabled={watchType === 'trial'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Max activations */}
          <FormField
            control={form.control}
            name="max_activations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Máx. activaciones</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Billing interval (subscription only) */}
          {watchType === 'subscription' && (
            <FormField
              control={form.control}
              name="billing_interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intervalo de cobro</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="month">Mensual</SelectItem>
                      <SelectItem value="year">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Trial days (trial standalone, or optional trial for subscription) */}
          {(watchType === 'trial' || watchType === 'subscription') && (
            <FormField
              control={form.control}
              name="trial_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchType === 'subscription' ? 'Días gratis antes del primer cobro (opcional)' : 'Días de prueba'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      placeholder={watchType === 'subscription' ? 'Ej: 7, 14, 30…' : ''}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  {watchType === 'subscription' && (
                    <p className="text-xs text-muted-foreground">
                      Se solicita tarjeta al registrarse. El cobro inicia al terminar el período de prueba.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Features */}
        <div>
          <FormLabel>Características del plan</FormLabel>
          <div className="mt-2 space-y-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="flex-1 bg-muted rounded px-2 py-1">{f}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
                placeholder="Agregar característica…"
                className="text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0 cursor-pointer">Plan activo</FormLabel>
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando…' : plan ? 'Guardar' : 'Crear plan'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
