import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Key, ShoppingCart, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'

export default async function AdminPage() {
  const supabase = createServiceClient()

  const [
    { count: totalProducts },
    { count: totalLicenses },
    { count: totalOrders },
    { count: totalCustomers },
    { data: revenueData },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('orders').select('total_amount').eq('status', 'completed'),
    supabase
      .from('orders')
      .select('id, user_id, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalRevenue = (revenueData ?? []).reduce((sum, o) => sum + o.total_amount, 0)

  const stats = [
    { label: 'Revenue total', value: formatCurrency(totalRevenue), icon: ShoppingCart, color: 'text-green-600' },
    { label: 'Licencias activas', value: String(totalLicenses ?? 0), icon: Key, color: 'text-blue-600' },
    { label: 'Órdenes completadas', value: String(totalOrders ?? 0), icon: ShoppingCart, color: 'text-purple-600' },
    { label: 'Productos', value: String(totalProducts ?? 0), icon: Package, color: 'text-orange-600' },
    { label: 'Clientes', value: String(totalCustomers ?? 0), icon: Users, color: 'text-pink-600' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Vista general de la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Órdenes recientes</CardTitle>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent>
          {(recentOrders ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin órdenes aún</p>
          ) : (
            <div className="space-y-3">
              {(recentOrders ?? []).map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground font-mono text-xs">{order.id.slice(0, 8)}…</p>
                      <p className="text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString('es')}</p>
                    </div>
                    <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
