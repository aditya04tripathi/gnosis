import type { Metadata } from "next";
import Footer from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Startup Validator. Learn how we collect, use, and protect your personal data. Your privacy and data security are our priorities.",
  keywords: [
    "privacy policy",
    "data protection",
    "privacy",
    "GDPR",
    "data security",
  ],
  openGraph: {
    title: "Privacy Policy | Startup Validator",
    description: "Learn how we protect your personal data and privacy.",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2>Introduction</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Welcome to Startup Validator. We respect your privacy and are
                committed to protecting your personal data. This privacy policy
                will inform you about how we look after your personal data when
                you visit our website and tell you about your privacy rights.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Information We Collect</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We may collect, use, store and transfer different kinds of
                personal data about you:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm sm:text-base">
                <li>
                  <strong>Identity Data:</strong> includes name, username or
                  similar identifier
                </li>
                <li>
                  <strong>Contact Data:</strong> includes email address
                </li>
                <li>
                  <strong>Technical Data:</strong> includes internet protocol
                  (IP) address, browser type and version
                </li>
                <li>
                  <strong>Usage Data:</strong> includes information about how
                  you use our website and services
                </li>
                <li>
                  <strong>Payment Data:</strong> includes payment information
                  processed securely through PayPal
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2>How We Use Your Information</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We use your information to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm sm:text-base">
                <li>Provide and maintain our service</li>
                <li>Process your transactions and send related information</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze usage patterns</li>
                <li>Detect and prevent fraud and abuse</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Information Sharing</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We do not sell, trade, or rent your personal information. We may
                share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm sm:text-base">
                <li>
                  With service providers who assist us in operating our platform
                </li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Data Security</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We have put in place appropriate security measures to prevent
                your personal data from being accidentally lost, used or
                accessed in an unauthorized way, altered or disclosed. We use
                industry-standard encryption and secure servers to protect your
                data.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Data Retention</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We retain your information for as long as your account is active
                or as needed to provide services. You may request deletion of
                your account and data at any time.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Cookies</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We use cookies and similar tracking technologies to track
                activity on our service and hold certain information. You can
                instruct your browser to refuse all cookies or to indicate when
                a cookie is being sent.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Third-Party Services</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We may employ third-party companies and services for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm sm:text-base">
                <li>Payment processing (PayPal)</li>
                <li>Authentication and security services</li>
                <li>Analytics and performance monitoring</li>
              </ul>
              <p className="mt-4 text-sm sm:text-base leading-relaxed">
                These third parties have access to your personal data only to
                perform these tasks on our behalf and are obligated not to
                disclose or use it for any other purpose.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Children's Privacy</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Our Service is not intended for children under 13 years of age.
                We do not knowingly collect personal information from children
                under 13.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Your Rights</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm sm:text-base">
                <li>Request access to your personal data</li>
                <li>Request correction of your personal data</li>
                <li>Request erasure of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
                <li>Request transfer of your personal data</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Changes to This Policy</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Contact Us</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                If you have any questions about this Privacy Policy, please
                contact us through our support channels.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
