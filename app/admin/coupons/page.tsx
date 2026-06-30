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
import { formatDate } from '@/lib/utils/formatters'
import type { Coupon } from '@/types'
import CreateCouponDialog from '@/components/admin/CreateCouponDialog'
import ToggleCouponButton from '@/components/admin/ToggleCouponButton'

export default async function AdminCouponsPage() {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  const coupons = (data ?? []) as Coupon[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes</p>
        </div>
        <CreateCouponDialog />
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg">
          <p>No coupons yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <code className="font-mono text-sm font-semibold">{coupon.code}</code>
                  </TableCell>
                  <TableCell className="text-sm capitalize">{coupon.type}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `$${(coupon.value / 100).toFixed(2)}`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {coupon.expires_at ? formatDate(coupon.expires_at) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={coupon.is_active ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-50 border-gray-200'}
                    >
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ToggleCouponButton couponId={coupon.id} isActive={coupon.is_active} />
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
