import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import type { OrderWithItems } from '@/types'
import Link from 'next/link'

interface SearchParams {
  status?: string
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status } = await searchParams
  const supabase = createServiceClient()

  let query = supabase
    .from('orders')
    .select('*, order_items(*, products(id, name, slug, thumbnail_url), license_plans(id, name, type))')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && ['pending', 'completed', 'refunded', 'failed'].includes(status)) {
    query = query.eq('status', status as 'pending' | 'completed' | 'refunded' | 'failed')
  }

  const { data } = await query
  const orders = (data ?? []) as OrderWithItems[]

  const statuses = ['pending', 'completed', 'refunded', 'failed'] as const

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">All customer orders</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href="/admin/orders"
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!status ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${status === s ? ORDER_STATUS_COLORS[s] : 'hover:bg-muted'}`}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg">
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Product(s)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {order.id.slice(0, 8)}…
                    </span>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {order.order_items.map((i) => i.products?.name).filter(Boolean).join(', ')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] ?? ''}`}
                    >
                      {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatCurrency(order.total_amount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
