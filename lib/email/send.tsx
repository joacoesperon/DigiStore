import { render } from '@react-email/render'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_EMAIL } from './resend'
import {
  PaymentFailedEmail,
  PaymentRecoveredEmail,
  SubscriptionCancelledEmail,
  TrialExpiredEmail,
  TrialExpiringSoonEmail,
} from './templates'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

async function getEmailData(licenseId: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('licenses')
    .select('id, user_id, expires_at, products(name, slug), license_plans(name)')
    .eq('id', licenseId)
    .single()

  if (!data) return null

  // PostgREST returns single-object for many-to-one relations
  const products = data.products as unknown as { name: string; slug: string } | null
  const license_plans = data.license_plans as unknown as { name: string } | null

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', data.user_id)
    .single()

  if (!profile?.email) return null

  return {
    email: profile.email as string,
    productName: products?.name ?? 'Product',
    planName: license_plans?.name ?? 'Plan',
    productSlug: products?.slug ?? '',
    expiresAt: data.expires_at,
  }
}

export async function sendPaymentFailedEmail(
  licenseId: string,
  nextRetryAt: number | null
) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const d = await getEmailData(licenseId)
    if (!d) return

    const dashboardUrl = `${SITE_URL}/dashboard/licenses/${licenseId}`
    const nextRetryDate = nextRetryAt
      ? fmtDate(new Date(nextRetryAt * 1000).toISOString())
      : null

    const html = await render(
      <PaymentFailedEmail
        productName={d.productName}
        planName={d.planName}
        nextRetryDate={nextRetryDate}
        dashboardUrl={dashboardUrl}
      />
    )

    await resend.emails.send({
      from: FROM_EMAIL,
      to: d.email,
      subject: `Payment failed for ${d.productName}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendPaymentFailedEmail failed:', err)
  }
}

export async function sendPaymentRecoveredEmail(licenseId: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const d = await getEmailData(licenseId)
    if (!d) return

    const dashboardUrl = `${SITE_URL}/dashboard/licenses/${licenseId}`
    const nextRenewalDate = fmtDate(d.expiresAt)

    const html = await render(
      <PaymentRecoveredEmail
        productName={d.productName}
        planName={d.planName}
        nextRenewalDate={nextRenewalDate}
        dashboardUrl={dashboardUrl}
      />
    )

    await resend.emails.send({
      from: FROM_EMAIL,
      to: d.email,
      subject: `Payment successful — ${d.productName} subscription restored`,
      html,
    })
  } catch (err) {
    console.error('[email] sendPaymentRecoveredEmail failed:', err)
  }
}

export async function sendSubscriptionCancelledEmail(licenseId: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const d = await getEmailData(licenseId)
    if (!d) return

    const storeUrl = `${SITE_URL}/products/${d.productSlug}`
    const accessUntilDate = fmtDate(d.expiresAt)

    const html = await render(
      <SubscriptionCancelledEmail
        productName={d.productName}
        planName={d.planName}
        accessUntilDate={accessUntilDate}
        storeUrl={storeUrl}
      />
    )

    await resend.emails.send({
      from: FROM_EMAIL,
      to: d.email,
      subject: `Your ${d.productName} subscription has been cancelled`,
      html,
    })
  } catch (err) {
    console.error('[email] sendSubscriptionCancelledEmail failed:', err)
  }
}

export async function sendTrialExpiredEmail(licenseId: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const d = await getEmailData(licenseId)
    if (!d) return

    const storeUrl = `${SITE_URL}/products/${d.productSlug}`

    const html = await render(
      <TrialExpiredEmail
        productName={d.productName}
        planName={d.planName}
        storeUrl={storeUrl}
      />
    )

    await resend.emails.send({
      from: FROM_EMAIL,
      to: d.email,
      subject: `Your free trial for ${d.productName} has ended`,
      html,
    })
  } catch (err) {
    console.error('[email] sendTrialExpiredEmail failed:', err)
  }
}

export async function sendTrialExpiringEmail(licenseId: string, daysLeft: number) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const d = await getEmailData(licenseId)
    if (!d) return

    const storeUrl = `${SITE_URL}/products/${d.productSlug}`
    const expiresDate = fmtDate(d.expiresAt)

    const html = await render(
      <TrialExpiringSoonEmail
        productName={d.productName}
        planName={d.planName}
        daysLeft={daysLeft}
        expiresDate={expiresDate}
        storeUrl={storeUrl}
      />
    )

    await resend.emails.send({
      from: FROM_EMAIL,
      to: d.email,
      subject: `Your ${d.productName} trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendTrialExpiringEmail failed:', err)
  }
}
