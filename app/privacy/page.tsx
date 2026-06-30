import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — DigiStore',
  description: 'How DigiStore collects, uses and protects your personal data.',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 9, 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold mb-2">1. Who we are</h2>
          <p>
            DigiStore (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;the platform&rdquo;) is a digital product and license
            management service. This Privacy Policy explains what personal data we collect when you
            use DigiStore, how we use it, and your rights regarding that data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Data we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> name, email address, and hashed password when you register.</li>
            <li><strong>OAuth data:</strong> if you sign in with Google, we receive your name and email from Google. We do not receive your Google password.</li>
            <li><strong>Purchase data:</strong> product names, plan types, amounts paid, payment reference IDs from Stripe. We do not store full card numbers — payments are processed entirely by Stripe.</li>
            <li><strong>License data:</strong> license keys issued to you, activation dates, machine identifiers you activate licenses on, and last-seen timestamps.</li>
            <li><strong>Usage data:</strong> IP addresses and timestamps captured when your software calls the license verification API (<code>/api/v1/licenses/verify</code>). This is used for rate limiting and fraud detection only.</li>
            <li><strong>Technical data:</strong> browser type and device metadata collected automatically by our infrastructure.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. How we use your data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and manage your account.</li>
            <li>To process payments and issue license keys.</li>
            <li>To verify license validity when requested by your software.</li>
            <li>To provide customer support and respond to your inquiries.</li>
            <li>To detect fraud and prevent abuse of the platform.</li>
            <li>To comply with legal obligations.</li>
          </ul>
          <p className="mt-2">We do not sell your personal data to third parties. We do not use your data for advertising purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Third-party processors</h2>
          <p>We share data with the following processors solely to operate the service:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Supabase Inc.</strong> — database and authentication infrastructure. Data is stored on servers in the EU or US depending on your project region. <a href="https://supabase.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a>.</li>
            <li><strong>Stripe Inc.</strong> — payment processing. Stripe handles all card data and is PCI-DSS compliant. We only receive anonymised payment confirmations. <a href="https://stripe.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a>.</li>
            <li><strong>Google LLC</strong> — if you use &ldquo;Sign in with Google&rdquo;, Google processes your authentication. <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Data retention</h2>
          <p>
            We retain your account data for as long as your account is active. Purchase and license
            records are kept for a minimum of 5 years for accounting and legal compliance purposes.
            License event logs (API calls, activations) are retained for 12 months and then deleted.
          </p>
          <p className="mt-2">
            You may request deletion of your account at any time by contacting us. Note that
            transaction records required for legal compliance cannot be deleted.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Your rights (GDPR)</h2>
          <p>If you are in the European Economic Area, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Access</strong> — request a copy of the data we hold about you.</li>
            <li><strong>Rectification</strong> — ask us to correct inaccurate data.</li>
            <li><strong>Erasure</strong> — request deletion of your data (subject to legal retention obligations).</li>
            <li><strong>Portability</strong> — receive your data in a machine-readable format.</li>
            <li><strong>Object</strong> — object to certain types of processing.</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, contact us at the email listed in Section 8.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Cookies</h2>
          <p>
            We use session cookies solely to maintain your authenticated state. We do not use
            tracking cookies or advertising pixels. No consent banner is required for strictly
            necessary cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8. Contact</h2>
          <p>
            For any privacy-related questions or data requests, contact us at:{' '}
            <a href="mailto:privacy@licensehub.io" className="underline">privacy@licensehub.io</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">9. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Material changes will be notified by email
            or via a prominent notice on the platform. Continued use after the effective date
            constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t text-sm text-muted-foreground flex gap-4">
        <Link href="/terms" className="hover:text-foreground underline">Terms of Service</Link>
        <Link href="/" className="hover:text-foreground underline">Back to home</Link>
      </div>
    </div>
  )
}
