import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import type { OrderWithItems } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package } from 'lucide-react'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*, products(id, name, slug, thumbnail_url), license_plans(id, name, type))')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!data) notFound()

  const order = data as unknown as OrderWithItems
  const statusColor = ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] ?? ''
  const statusLabel = ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/orders"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Order</h1>
          <p className="text-xs text-muted-foreground font-mono">{order.id}</p>
        </div>
        <Badge variant="outline" className={`ml-auto shrink-0 ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Order items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.order_items.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <Separator className="mb-4" />}
              <div className="flex items-start gap-3">
                {item.products?.thumbnail_url ? (
                  <Image
                    src={item.products.thumbnail_url}
                    alt={item.products.name ?? ''}
                    width={48}
                    height={48}
                    className="rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {item.products?.name ?? 'Product'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.license_plans?.name} · {item.license_plans?.type}
                  </p>
                </div>
                <p className="text-sm font-medium shrink-0">{formatCurrency(item.price)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.total_amount + order.discount_amount)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount</span>
              <span>-{formatCurrency(order.discount_amount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-muted-foreground">
            <span>Date</span>
            <span>{formatDateTime(order.created_at)}</span>
          </div>
          {order.stripe_session_id && (
            <div className="flex justify-between text-muted-foreground">
              <span>Payment ref</span>
              <span className="font-mono text-xs truncate max-w-[180px]">{order.stripe_session_id}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
