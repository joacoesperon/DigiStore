import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import {
  LICENSE_STATUS_LABELS,
  LICENSE_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/types'
import type { Profile, License, Product, LicensePlan, OrderWithItems } from '@/types'
import { ArrowLeft } from 'lucide-react'

type LicenseRow = License & {
  products: Pick<Product, 'id' | 'name' | 'slug' | 'type'>
  license_plans: Pick<LicensePlan, 'id' | 'name'>
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profileData) notFound()
  const customer = profileData as Profile

  const { data: licensesData } = await supabase
    .from('licenses')
    .select('*, products(id, name, slug, type), license_plans(id, name)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
  const licenses = (licensesData ?? []) as unknown as LicenseRow[]

  const { data: ordersData } = await supabase
    .from('orders')
    .select('*, order_items(*, products(id, name))')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
  const orders = (ordersData ?? []) as OrderWithItems[]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/customers"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Customers
        </Link>
      </div>

      {/* Customer info */}
      <Card>
        <CardHeader>
          <CardTitle>{customer.full_name ?? '—'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-0.5">Email</p>
            <p>{customer.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Role</p>
            <Badge variant="secondary" className="capitalize">{customer.role}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Joined</p>
            <p>{formatDate(customer.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Licenses */}
      <div>
        <h2 className="text-base font-semibold mb-3">
          Licenses ({licenses.length})
        </h2>
        {licenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No licenses yet.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="text-sm font-medium">
                      <Link href={`/admin/licenses/${license.id}`} className="hover:underline">
                        {license.products.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {license.license_plans.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${LICENSE_STATUS_COLORS[license.status as keyof typeof LICENSE_STATUS_COLORS] ?? ''}`}
                      >
                        {LICENSE_STATUS_LABELS[license.status as keyof typeof LICENSE_STATUS_LABELS] ?? license.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(license.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-base font-semibold mb-3">
          Orders ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {order.id.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] ?? ''}`}
                      >
                        {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                      </Badge>
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
    </div>
  )
}
