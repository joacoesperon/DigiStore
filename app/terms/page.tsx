import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — DigiStore',
  description: 'The terms and conditions governing your use of DigiStore.',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 9, 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold mb-2">1. Acceptance of terms</h2>
          <p>
            By creating an account or making a purchase on DigiStore (&ldquo;the platform&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to be bound by these Terms of Service.
            If you do not agree, you must not use the platform. These terms apply to all users,
            including buyers, visitors, and administrators.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Description of the service</h2>
          <p>
            DigiStore is a platform that allows sellers to distribute digital products (software,
            ebooks, courses, templates, and similar content) under a license model. Buyers receive
            a license key that grants them rights to use the product according to the terms defined
            by the seller.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Eligibility</h2>
          <p>
            You must be at least 18 years old to use this platform. By registering, you represent
            that all information you provide is accurate and that you have the legal capacity to
            enter into a binding agreement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. License terms</h2>
          <p>
            Upon successful payment, you receive a non-exclusive, non-transferable license to use
            the purchased digital product according to the plan you selected (perpetual, subscription,
            or trial). The license:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Is limited to the number of simultaneous activations specified in your plan.</li>
            <li>Cannot be resold, sublicensed, or transferred to another person.</li>
            <li>For <strong>subscription</strong> plans: remains active only while payments are current. Access is revoked automatically upon cancellation or failed payment.</li>
            <li>For <strong>perpetual</strong> plans: grants lifetime access to the version purchased, but does not guarantee access to future major updates unless explicitly stated.</li>
            <li>For <strong>trial</strong> plans: provides time-limited access at no charge. At expiry, access is revoked automatically.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Payments and refunds</h2>
          <p>
            Payments are processed by Stripe. All prices are shown in USD unless otherwise stated.
            Taxes may apply depending on your jurisdiction.
          </p>
          <p className="mt-2">
            <strong>Refund policy:</strong> Due to the digital nature of the products, all sales
            are final by default. Refunds may be issued at the seller&rsquo;s discretion within 14 days
            of purchase if the product is materially defective or does not match its description.
            Refund requests must be submitted to support. Issued licenses are revoked upon refund.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Acceptable use</h2>
          <p>You must not:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Attempt to bypass, reverse-engineer, or circumvent the license verification system.</li>
            <li>Share, resell, or distribute license keys you have purchased.</li>
            <li>Use the platform to distribute illegal, harmful, or malicious software.</li>
            <li>Conduct automated attacks (DDoS, brute-force) against the platform or its API.</li>
            <li>Impersonate another user, seller, or administrator.</li>
          </ul>
          <p className="mt-2">
            Violation of these terms may result in immediate suspension or permanent revocation
            of your account and all associated licenses, without refund.
          </p>
        </section>

        <section className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-amber-900">7. Disclaimer for financial and trading products</h2>
          <p className="text-amber-800">
            Certain products available on this platform may include algorithmic trading systems,
            bots, indicators, signals, scripts, or related financial tools (collectively,
            &ldquo;Trading Products&rdquo;).
          </p>
          <p className="mt-3 text-amber-800">
            <strong>THE PLATFORM MAKES NO REPRESENTATIONS OR WARRANTIES WHATSOEVER REGARDING THE
            FINANCIAL PERFORMANCE OF ANY TRADING PRODUCT SOLD THROUGH LICENSEHUB.</strong>
          </p>
          <p className="mt-3 text-amber-800">
            By purchasing a Trading Product, you expressly acknowledge and agree that:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2 text-amber-800">
            <li>Past performance is not indicative of future results. All trading involves risk of loss, including the possible loss of all capital invested.</li>
            <li>The platform is not a registered investment advisor, broker-dealer, or financial institution. Nothing on this platform constitutes financial advice, investment advice, or a recommendation to buy or sell any financial instrument.</li>
            <li>You are solely responsible for any trading decisions you make and for evaluating the suitability of any Trading Product for your own financial circumstances.</li>
            <li>DigiStore, its owners, operators, and affiliates shall bear <strong>no liability whatsoever</strong> for any losses, damages, or claims arising from your use of any Trading Product purchased through the platform, regardless of whether such losses are direct, indirect, incidental, consequential, or otherwise.</li>
            <li>The seller of the Trading Product — not DigiStore — is solely responsible for the accuracy, legality, and performance of the product.</li>
          </ul>
          <p className="mt-3 text-amber-800">
            If you do not accept these conditions, you must not purchase Trading Products on this platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by applicable law, DigiStore and its operators shall
            not be liable for any indirect, incidental, special, consequential, or punitive damages
            arising out of or in connection with your use of the platform, including but not limited
            to loss of profits, loss of data, or business interruption, even if we have been advised
            of the possibility of such damages.
          </p>
          <p className="mt-2">
            Our total liability to you for any claim arising from these terms or your use of the
            platform shall not exceed the amount you paid to us in the twelve (12) months preceding
            the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">9. Intellectual property</h2>
          <p>
            All content created by the platform (UI, branding, documentation) is owned by
            DigiStore. The digital products sold through the platform are owned by their
            respective sellers. A license purchase grants you usage rights only — it does not
            transfer ownership or intellectual property rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">10. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts at any time for violation of
            these terms. You may close your account at any time. Upon termination, your licenses
            may be revoked at our discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">11. Governing law</h2>
          <p>
            These terms are governed by and construed in accordance with the laws of Spain, without
            regard to its conflict of law provisions. Any disputes shall be subject to the exclusive
            jurisdiction of the courts of Mallorca, Spain.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">12. Changes to these terms</h2>
          <p>
            We may update these terms periodically. Continued use of the platform after the updated
            terms take effect constitutes your acceptance. We will notify you of material changes
            by email or via the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">13. Contact</h2>
          <p>
            For questions about these terms, contact us at:{' '}
            <a href="mailto:legal@licensehub.io" className="underline">legal@licensehub.io</a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t text-sm text-muted-foreground flex gap-4">
        <Link href="/privacy" className="hover:text-foreground underline">Privacy Policy</Link>
        <Link href="/" className="hover:text-foreground underline">Back to home</Link>
      </div>
    </div>
  )
}
