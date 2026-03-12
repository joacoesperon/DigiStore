import { createClient, createServiceClient } from '@/lib/supabase/server'
import LicenseCard from '@/components/licenses/LicenseCard'
import type { LicenseWithProduct } from '@/types'

export default async function LicensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const serviceClient = createServiceClient()
  const { data } = await serviceClient
    .from('licenses')
    .select('*, products(id, name, slug, thumbnail_url, type), license_plans(id, name, type, billing_interval)')
    .eq('user_id', user!.id)
    .neq('status', 'revoked')
    .order('created_at', { ascending: false })

  const licenses = (data ?? []) as LicenseWithProduct[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Licenses</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your product licenses and device activations.
        </p>
      </div>

      {licenses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No licenses yet</p>
          <p className="text-sm mt-1">Purchase a product to get started.</p>
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
