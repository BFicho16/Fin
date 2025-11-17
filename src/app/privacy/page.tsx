import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Fin',
  description: 'Privacy Policy for Fin',
}

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          
          <p className="text-muted-foreground mb-2">
            <strong>HustleWing LLC DBA Fin Routine</strong>
          </p>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                HustleWing LLC DBA Fin Routine (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Fin Routine service. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered longevity coach service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <p className="text-muted-foreground mb-2">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Account Information:</strong> Email address, password, and profile information you provide during registration</li>
                <li><strong>Routine and Health Data:</strong> Information about your daily routines, habits, sleep patterns, exercise, and other health-related information you share with our AI coach</li>
                <li><strong>Conversation Data:</strong> Messages, questions, and interactions you have with our AI longevity coach</li>
                <li><strong>Usage Data:</strong> Information about how you interact with the Service, including features used, time spent, and navigation patterns</li>
                <li><strong>Payment Information:</strong> Billing details and payment information processed through our payment providers (we do not store full credit card numbers)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Provide the Service:</strong> Deliver personalized longevity coaching recommendations and guidance tailored to your routines and habits</li>
                <li><strong>Improve Recommendations:</strong> Use your data to better inform and personalize recommendations for you</li>
                <li><strong>Maintain and Improve:</strong> Operate, maintain, and improve our Service, including analyzing usage patterns</li>
                <li><strong>Customer Support:</strong> Respond to your inquiries, provide technical support, and send service-related communications</li>
                <li><strong>Process Payments:</strong> Process subscription payments and manage your account</li>
                <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our Terms of Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. AI Service Providers</h2>
              <p className="text-muted-foreground">
                Our Service uses third-party AI APIs to provide the longevity coaching functionality. When you interact with our AI coach, your messages and relevant context may be transmitted to these third-party AI service providers to generate responses. These providers are contractually obligated to handle your data in accordance with industry security standards. However, we are not responsible for the privacy practices of these third-party AI providers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-2">
                We value your privacy and do not share your personal information outside of our company without your explicit permission, except in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Third-Party AI Services:</strong> As necessary to provide the Service, your data may be shared with third-party AI API providers who process it to generate responses</li>
                <li><strong>Service Providers:</strong> We may share information with trusted service providers who assist us in operating our Service (e.g., hosting, payment processing, analytics), subject to confidentiality obligations</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction</li>
                <li><strong>With Your Consent:</strong> We may share your information when you explicitly authorize us to do so</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                <strong>We do not sell, rent, or trade your personal information to third parties for their marketing purposes.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
              <p className="text-muted-foreground">
                We implement reasonable technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed to provide you with the Service. If you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal or legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Your Rights and Choices</h2>
              <p className="text-muted-foreground mb-2">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information in your account</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications (service-related communications may still be sent)</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                To exercise these rights, please contact us at <a href="mailto:brian@finroutine.com" className="underline hover:text-foreground">brian@finroutine.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies help us improve your experience by remembering your preferences and enabling certain features. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground">
                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by updating the &quot;Last updated&quot; date at the top of this page. Your continued use of the Service after such modifications constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> <a href="mailto:brian@finroutine.com" className="underline hover:text-foreground">brian@finroutine.com</a>
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Company:</strong> HustleWing LLC DBA Fin Routine
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

