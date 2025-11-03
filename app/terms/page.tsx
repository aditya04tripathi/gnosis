import type { Metadata } from "next";
import Footer from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Terms and Conditions for Startup Validator. Read our terms of service and usage agreement to understand your rights and responsibilities.",
  keywords: [
    "terms and conditions",
    "terms of service",
    "user agreement",
    "legal",
    "terms",
  ],
  openGraph: {
    title: "Terms and Conditions | Startup Validator",
    description: "Terms of service and usage agreement for Startup Validator.",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2">Terms and Conditions</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2>Acceptance of Terms</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                By accessing and using Startup Validator (&quot;the
                Service&quot;), you accept and agree to be bound by the terms
                and provision of this agreement.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Description of Service</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Startup Validator is an AI-powered platform that provides
                startup idea validation, project planning, and business
                insights. We offer various subscription plans with different
                features and usage limits.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>User Accounts</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                You are responsible for maintaining the confidentiality of your
                account credentials. You agree to notify us immediately of any
                unauthorized use of your account.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Subscription and Payment</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Subscriptions are billed on a monthly or yearly basis. Payments
                are processed through PayPal. All fees are non-refundable unless
                required by law or as stated in our refund policy.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Usage Limits</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Free accounts include 5 validations. Paid plans have specific
                limits as outlined in our pricing page. Usage is tracked and
                enforced per subscription period.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Intellectual Property</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                All content, features, and functionality of the Service are
                owned by Startup Validator and are protected by international
                copyright, trademark, and other intellectual property laws.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>User Content</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                You retain ownership of any content you submit. By submitting
                content, you grant us a license to use, modify, and display such
                content for the purpose of providing the Service.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Limitation of Liability</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Startup Validator provides AI-generated suggestions and insights
                for informational purposes only. We do not guarantee the
                accuracy, completeness, or usefulness of any information
                provided. You use the Service at your own risk.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Termination</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We may terminate or suspend your account immediately, without
                prior notice, for conduct that we believe violates these Terms
                or is harmful to other users, us, or third parties.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Changes to Terms</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We reserve the right to modify these terms at any time. Your
                continued use of the Service after any changes constitutes
                acceptance of the new terms.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2>Contact Information</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                If you have any questions about these Terms, please contact us
                through our support channels.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
