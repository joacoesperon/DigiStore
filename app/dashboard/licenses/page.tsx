import { createClient, createServiceClient } from '@/lib/supabase/server'
import LicenseCard from '@/components/licenses/LicenseCard'
import type { LicenseWithProduct } from '@/types'
import Link from 'next/link'

export default async function LicensesPage({
  searchParams,
}: {
  searchParams: Promise<{ show_hidden?: string }>
}) {
  const { show_hidden } = await searchParams
  const showHidden = show_hidden === '1'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const serviceClient = createServiceClient()

  const visibleQuery = serviceClient
    .from('licenses')
    .select('*, products(id, name, slug, thumbnail_url, type), license_plans(id, name, type, billing_interval)')
    .eq('user_id', user!.id)
    .eq('hidden', showHidden)
    .order('created_at', { ascending: false })

  const hiddenCountQuery = serviceClient
    .from('licenses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('hidden', true)

  const [{ data }, { count: hiddenCount }] = await Promise.all([visibleQuery, hiddenCountQuery])

  const licenses = (data ?? []) as LicenseWithProduct[]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Licenses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your product licenses and device activations.
          </p>
        </div>
        {showHidden ? (
          <Link
            href="/dashboard/licenses"
            className="text-sm text-muted-foreground hover:text-foreground shrink-0 mt-1"
          >
            ← Back to licenses
          </Link>
        ) : (
          hiddenCount != null && hiddenCount > 0 && (
            <Link
              href="/dashboard/licenses?show_hidden=1"
              className="text-sm text-muted-foreground hover:text-foreground shrink-0 mt-1"
            >
              Show {hiddenCount} hidden license{hiddenCount !== 1 ? 's' : ''}
            </Link>
          )
        )}
      </div>

      {showHidden && (
        <p className="text-sm text-muted-foreground">
          Showing hidden licenses. These don&apos;t appear in your main dashboard.
        </p>
      )}

      {licenses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">
            {showHidden ? 'No hidden licenses' : 'No licenses yet'}
          </p>
          <p className="text-sm mt-1">
            {showHidden ? 'All your licenses are visible.' : 'Purchase a product to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {licenses.map((license) => (
            <LicenseCard key={license.id} license={license} />
          ))}
        </div>
      )}
    </div>
  )
}
