import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import type { OrderWithItems } from '@/types'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*, products(id, name, slug, thumbnail_url), license_plans(id, name, type))')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const orders = (data ?? []) as OrderWithItems[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your purchase history and order details.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm mt-1">Your purchases will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
              <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {order.order_items.map((i) => i.products?.name).filter(Boolean).join(', ') || 'Order'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(order.created_at)} · {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <Badge
                    variant="outline"
                    className={`text-xs ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] ?? ''}`}
                  >
                    {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                  </Badge>
                  <span className="text-sm font-medium">{formatCurrency(order.total_amount)}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
