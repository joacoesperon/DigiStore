import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente con service_role key — bypasa RLS completamente.
 * SOLO usar en API routes del servidor. Nunca importar en código cliente.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
