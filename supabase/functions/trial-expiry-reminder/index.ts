// Supabase Edge Function — trial-expiry-reminder
// Schedule: daily at 09:00 UTC
// Deploy: supabase functions deploy trial-expiry-reminder
//
// Required Supabase secrets (set via `supabase secrets set`):
//   SITE_URL     — e.g. https://your-app.com
//   INTERNAL_SECRET — same value as in Next.js .env

Deno.serve(async () => {
  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:3000'
  const secret = Deno.env.get('INTERNAL_SECRET') ?? ''

  try {
    const res = await fetch(`${siteUrl}/api/internal/trial-reminder`, {
      method: 'POST',
      headers: {
        'x-internal-secret': secret,
        'content-type': 'application/json',
      },
    })

    const body = await res.json()
    console.log('[trial-expiry-reminder] result:', body)

    return new Response(JSON.stringify(body), {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    console.error('[trial-expiry-reminder] error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
})
