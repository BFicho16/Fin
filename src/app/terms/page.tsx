import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Fin',
  description: 'Terms of Service for Fin',
}

export default function TermsPage() {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-background p-4 sm:p-8 md:p-12 lg:p-16">
      <div className="max-w-3xl mx-auto">
        <a 
          href="/" 
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          ← Back to Home
        </a>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          
          <p className="text-muted-foreground mb-2">
            <strong>HustleWing LLC DBA Fin Routine</strong>
          </p>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using Fin Routine (&quot;Service&quot;), operated by HustleWing LLC DBA Fin Routine (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground">
                Fin Routine is an AI-powered longevity coach that uses third-party AI APIs to provide personalized recommendations and guidance based on your routines and habits. The Service is provided &quot;as is&quot; and we reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Account</h2>
              <p className="text-muted-foreground mb-2">
                To use the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept all responsibility for activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. User Responsibilities</h2>
              <p className="text-muted-foreground mb-2">
                You are solely responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>The accuracy of information you provide to the Service</li>
                <li>Your use of the recommendations and guidance provided by the AI coach</li>
                <li>Any decisions made based on the Service&apos;s recommendations</li>
                <li>Complying with all applicable laws and regulations</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                The Service provides general wellness and longevity guidance only and does not constitute medical, health, or professional advice. Always consult with qualified professionals for medical or health-related decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Subscription and Payment</h2>
              <p className="text-muted-foreground">
                Certain features of the Service may require a paid subscription. By purchasing a subscription, you agree to pay all fees associated with your subscription plan. Subscriptions will automatically renew unless cancelled. We reserve the right to change our pricing with notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
              <p className="text-muted-foreground">
                The Service and its original content, features, and functionality are owned by HustleWing LLC DBA Fin Routine and are protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Third-Party Services</h2>
              <p className="text-muted-foreground">
                The Service uses third-party AI APIs and other third-party services. We are not responsible for the availability, accuracy, or reliability of these third-party services. Your use of third-party services may be subject to separate terms and conditions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Disclaimers</h2>
              <p className="text-muted-foreground mb-2">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>The accuracy, reliability, or completeness of AI-generated recommendations</li>
                <li>The uninterrupted or error-free operation of the Service</li>
                <li>That the Service will meet your specific requirements or expectations</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We do not warrant that the Service is free of viruses or other harmful components.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, HUSTLEWING LLC DBA FIN ROUTINE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless HustleWing LLC DBA Fin Routine from any claims, damages, losses, liabilities, and expenses (including attorneys&apos; fees) arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by updating the &quot;Last updated&quot; date at the top of this page. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> <a href="mailto:brian@finroutine.com" className="underline hover:text-foreground">brian@finroutine.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

