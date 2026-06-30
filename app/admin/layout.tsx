import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Star,
  Key,
  Users,
} from 'lucide-react'
import AdminNavLink from './AdminNavLink'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/licenses', label: 'Licencias', icon: Key },
  { href: '/admin/orders', label: 'Órdenes', icon: ShoppingCart },
  { href: '/admin/coupons', label: 'Cupones', icon: Tag },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/customers', label: 'Usuarios', icon: Users },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r bg-muted/30 hidden md:flex flex-col py-4">
        <div className="px-4 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Admin Panel
          </span>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => (
            <AdminNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              exact={item.exact}
              icon={<item.icon className="h-4 w-4 shrink-0" />}
            />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
