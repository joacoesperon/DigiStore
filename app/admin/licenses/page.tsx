import Link from 'next/link'
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
import { LICENSE_STATUS_LABELS, LICENSE_STATUS_COLORS } from '@/types'
import type { LicenseWithProduct, Profile } from '@/types'
import { formatDate } from '@/lib/utils/formatters'
import { User } from 'lucide-react'

interface SearchParams {
  status?: string
  q?: string
}

export default async function AdminLicensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status, q } = await searchParams
  const supabase = createServiceClient()

  // If searching by email, resolve matching user IDs first
  let emailUserIds: string[] | null = null
  if (q && q.includes('@')) {
    const { data: matchingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', `%${q}%`)
    emailUserIds = (matchingProfiles ?? []).map((p) => p.id)
  }

  let query = supabase
    .from('licenses')
    .select('*, products(id, name, slug, thumbnail_url, type), license_plans(id, name, type, billing_interval)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && ['active', 'expired', 'revoked', 'suspended', 'trial'].includes(status)) {
    query = query.eq('status', status as 'active' | 'expired' | 'revoked' | 'suspended' | 'trial')
  }

  if (q) {
    if (emailUserIds !== null) {
      // Search by user ID (email match)
      if (emailUserIds.length > 0) {
        query = query.in('user_id', emailUserIds)
      } else {
        // No users matched — return empty set
        const licenses: LicenseWithProduct[] = []
        const statuses = ['active', 'trial', 'expired', 'suspended', 'revoked'] as const
        return renderPage(licenses, {}, status, q, statuses)
      }
    } else {
      // Search by license key
      query = query.ilike('license_key', `%${q}%`)
    }
  }

  const { data } = await query
  const licenses = (data ?? []) as LicenseWithProduct[]

  // Fetch profiles for all user_ids in the result set
  const userIds = [...new Set(licenses.map((l) => l.user_id))]
  let profileMap: Record<string, Pick<Profile, 'id' | 'email' | 'full_name'>> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
    profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
  }

  const statuses = ['active', 'trial', 'expired', 'suspended', 'revoked'] as const
  return renderPage(licenses, profileMap, status, q, statuses)
}

type ProfileSnippet = Pick<Profile, 'id' | 'email' | 'full_name'>

function renderPage(
  licenses: LicenseWithProduct[],
  profileMap: Record<string, ProfileSnippet>,
  status: string | undefined,
  q: string | undefined,
  statuses: readonly ('active' | 'trial' | 'expired' | 'suspended' | 'revoked')[]
) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Licenses</h1>
          <p className="text-muted-foreground">Search and manage all issued licenses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href="/admin/licenses"
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!status ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/licenses?status=${s}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${status === s ? LICENSE_STATUS_COLORS[s] : 'hover:bg-muted'}`}
          >
            {LICENSE_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="get" action="/admin/licenses" className="mb-4 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by license key or user email…"
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          Search
        </button>
      </form>

      {licenses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg">
          <p>No licenses found.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Key</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => {
                const owner = profileMap[license.user_id]
                return (
                  <TableRow key={license.id}>
                    <TableCell>
                      <Link
                        href={`/admin/licenses/${license.id}`}
                        className="font-mono text-xs hover:underline font-medium"
                      >
                        {license.license_key}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate max-w-[160px]">
                          {owner?.email ?? '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{license.products.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${LICENSE_STATUS_COLORS[license.status] ?? ''}`}
                      >
                        {LICENSE_STATUS_LABELS[license.status] ?? license.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {license.expires_at ? formatDate(license.expires_at) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(license.issued_at)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
