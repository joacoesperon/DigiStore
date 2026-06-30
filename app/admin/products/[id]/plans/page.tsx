import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PlansManager from '@/components/admin/PlansManager'
import type { LicensePlan } from '@/types'
import type { LicensePlanFormValues } from '@/lib/utils/validators'

export default async function ProductPlansPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug')
    .eq('id', id)
    .single()

  if (!product) notFound()

  const { data: plans } = await supabase
    .from('license_plans')
    .select('*')
    .eq('product_id', id)
    .order('price', { ascending: true })

  async function createPlan(
    productId: string,
    values: LicensePlanFormValues
  ): Promise<{ error?: string; data?: LicensePlan }> {
    'use server'
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('license_plans')
      .insert({
        product_id: productId,
        name: values.name,
        type: values.type,
        price: values.price,
        currency: values.currency,
        billing_interval: values.billing_interval ?? null,
        trial_days: values.trial_days ?? null,
        max_activations: values.max_activations,
        features: values.features,
        is_active: values.is_active,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as LicensePlan }
  }

  async function updatePlan(
    planId: string,
    values: LicensePlanFormValues
  ): Promise<{ error?: string }> {
    'use server'
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('license_plans')
      .update({
        name: values.name,
        type: values.type,
        price: values.price,
        currency: values.currency,
        billing_interval: values.billing_interval ?? null,
        trial_days: values.trial_days ?? null,
        max_activations: values.max_activations,
        features: values.features,
        is_active: values.is_active,
      })
      .eq('id', planId)

    if (error) return { error: error.message }
    return {}
  }

  async function deletePlan(planId: string): Promise<{ error?: string }> {
    'use server'
    const adminClient = createAdminClient()

    // 1. Obtener todas las licencias de este plan
    const { data: licenses } = await adminClient
      .from('licenses')
      .select('id')
      .eq('license_plan_id', planId)

    const licenseIds = (licenses ?? []).map((l) => l.id)

    if (licenseIds.length > 0) {
      // 2. Borrar activaciones y eventos de esas licencias
      await adminClient.from('license_activations').delete().in('license_id', licenseIds)
      await adminClient.from('license_events').delete().in('license_id', licenseIds)
      // 3. Borrar las licencias
      await adminClient.from('licenses').delete().in('id', licenseIds)
    }

    // 4. Obtener order_items de este plan
    const { data: orderItems } = await adminClient
      .from('order_items')
      .select('id, order_id')
      .eq('license_plan_id', planId)

    if (orderItems && orderItems.length > 0) {
      const orderIds = [...new Set(orderItems.map((oi) => oi.order_id))]

      // 5. Borrar los order_items
      await adminClient.from('order_items').delete().eq('license_plan_id', planId)

      // 6. Borrar órdenes que quedaron sin items
      for (const orderId of orderIds) {
        const { count } = await adminClient
          .from('order_items')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', orderId)
        if (!count || count === 0) {
          await adminClient.from('orders').delete().eq('id', orderId)
        }
      }
    }

    // 7. Borrar el plan
    const { error } = await adminClient.from('license_plans').delete().eq('id', planId)
    if (error) return { error: error.message }
    return {}
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <h1 className="text-2xl font-bold">Planes de licencia</h1>
        <p className="text-muted-foreground text-sm">{product.name}</p>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">{product.name}</p>
          <p className="text-xs text-muted-foreground">/{product.slug}</p>
        </CardContent>
      </Card>

      <PlansManager
        productId={product.id}
        initialPlans={(plans ?? []) as LicensePlan[]}
        onCreatePlan={createPlan}
        onUpdatePlan={updatePlan}
        onDeletePlan={deletePlan}
      />
    </div>
  )
}
