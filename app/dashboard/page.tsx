import { createClient } from '@/lib/supabase/server'
import LicenseCard from '@/components/licenses/LicenseCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import type { LicenseWithProduct, OrderWithItems } from '@/types'
import Link from 'next/link'
import { ArrowRight, Key, ShoppingBag } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: licensesData }, { data: ordersData }] = await Promise.all([
    supabase
      .from('licenses')
      .select('*, products(id, name, slug, thumbnail_url, type), license_plans(id, name, type, billing_interval)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('orders')
      .select('*, order_items(*, products(id, name, slug, thumbnail_url), license_plans(id, name, type))')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const licenses = (licensesData ?? []) as LicenseWithProduct[]
  const orders = (ordersData ?? []) as OrderWithItems[]

  const activeLicenses = licenses.filter((l) => l.status === 'active' || l.status === 'trial')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back. Here is a summary of your account.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{activeLicenses.length}</p>
                <p className="text-xs text-muted-foreground">Active licenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Total orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent licenses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Licenses</h2>
          <Link
            href="/dashboard/licenses"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {licenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No licenses yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {licenses.map((license) => (
              <LicenseCard key={license.id} license={license} />
            ))}
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link
            href="/dashboard/orders"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">
                      {order.order_items[0]?.products?.name ?? 'Order'}
                      {order.order_items.length > 1 && ` +${order.order_items.length - 1} more`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] ?? ''}`}
                    >
                      {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
