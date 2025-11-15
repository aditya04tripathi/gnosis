import type { Metadata } from "next";
import { LEGAL, METADATA } from "@/modules/shared/constants";

export const metadata: Metadata = METADATA.pages.terms;

export default function TermsPage() {
  return (
    <div className="pt-24 flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="container mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2">Terms and Conditions</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {LEGAL.terms.lastUpdated(new Date().toLocaleDateString())}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h4>Acceptance of Terms</h4>
              <p className="text-sm sm:text-base leading-relaxed">
                By accessing and using {LEGAL.terms.serviceName} (&quot;the
                Service&quot;), you accept and agree to be bound by the terms
                and provision of this agreement.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4>Description of Service</h4>
              <p className="text-sm sm:text-base leading-relaxed">
                {LEGAL.terms.serviceName} is an AI-powered platform that
                provides startup idea validation, project planning, and business
                insights.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4>User Accounts</h4>
              <p className="text-sm sm:text-base leading-relaxed">
                You are responsible for maintaining the confidentiality of your
                account credentials. You agree to notify us immediately of any
                unauthorized use of your account.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4>Usage Limits</h4>
              <p className="text-sm sm:text-base leading-relaxed">
                Free accounts include 1 validation per 2 days. Usage is tracked
                and enforced per period.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4>Intellectual Property</h4>
              <p className="text-sm sm:text-base leading-relaxed">
                All content, features, and functionality of the Service are
                owned by {LEGAL.terms.serviceName} and are protected by
                international copyright, trademark, and other intellectual
                property laws.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4>User Content</h4>
              <p className="text-sm sm:text-base leading-relaxed">
                You retain ownership of any content you submit. By submitting
                content, you grant us a license to use, modify, and display such
                content for the purpose of providing the Service.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4>Limitation of Liability</h4>
              <p className="text-sm sm:text-base leading-relaxed">
                {LEGAL.terms.serviceName} provides AI-generated suggestions and
                insights for informational purposes only. We do not guarantee
                the accuracy, completeness, or usefulness of any information
                provided. You use the Service at your own risk.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4>Termination</h4>
              <p className="text-sm sm:text-base leading-relaxed">
                We may terminate or suspend your account immediately, without
                prior notice, for conduct that we believe violates these Terms
                or is harmful to other users, us, or third parties.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4>Changes to Terms</h4>
              <p className="text-sm sm:text-base leading-relaxed">
                We reserve the right to modify these terms at any time. Your
                continued use of the Service after any changes constitutes
                acceptance of the new terms.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4>Contact Information</h4>
              <p className="text-sm sm:text-base leading-relaxed">
                If you have any questions about these Terms, please contact us
                through our support channels.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
