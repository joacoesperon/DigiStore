import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTrialExpiringEmail } from '@/lib/email/send'

const REMINDER_DAYS_BEFORE = 3

export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const windowEnd = new Date(now.getTime() + REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000)

  // Find trials expiring within the next 3 days that haven't been reminded yet
  const { data: expiringLicenses, error } = await supabase
    .from('licenses')
    .select('id, expires_at, metadata')
    .eq('status', 'trial')
    .gte('expires_at', now.toISOString())
    .lte('expires_at', windowEnd.toISOString())
    .filter('metadata->>trial_reminder_sent', 'is', null)

  if (error) {
    console.error('[trial-reminder] Query error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  let sent = 0
  for (const license of expiringLicenses ?? []) {
    const msLeft = new Date(license.expires_at!).getTime() - now.getTime()
    const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))

    await sendTrialExpiringEmail(license.id, daysLeft)

    await supabase
      .from('licenses')
      .update({
        metadata: { ...(license.metadata as Record<string, unknown>), trial_reminder_sent: true },
      })
      .eq('id', license.id)

    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
