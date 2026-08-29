import { LEGAL } from "@/modules/shared/constants";

export function PrivacyContent() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h4>Introduction</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          Welcome to {LEGAL.privacy.companyName}. We respect your privacy and
          are committed to protecting your personal data. This privacy policy
          will inform you about how we look after your personal data when you
          visit our website and tell you about your privacy rights.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Information We Collect</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          We may collect, use, store and transfer different kinds of personal
          data about you:
        </p>
        <ul className="ml-4 list-inside list-disc space-y-2 text-sm sm:text-base">
          <li>
            <strong>Identity Data:</strong> includes name, username or similar
            identifier
          </li>
          <li>
            <strong>Contact Data:</strong> includes email address
          </li>
          <li>
            <strong>Technical Data:</strong> includes internet protocol (IP)
            address, browser type and version
          </li>
          <li>
            <strong>Usage Data:</strong> includes information about how you use
            our website and services
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h4>How We Use Your Information</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          We use your information to:
        </p>
        <ul className="ml-4 list-inside list-disc space-y-2 text-sm sm:text-base">
          <li>Provide and maintain our service</li>
          <li>Process your transactions and send related information</li>
          <li>Send you technical notices and support messages</li>
          <li>Respond to your comments and questions</li>
          <li>Monitor and analyze usage patterns</li>
          <li>Detect and prevent fraud and abuse</li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Information Sharing</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          We do not sell, trade, or rent your personal information. We may share
          your information only in the following circumstances:
        </p>
        <ul className="ml-4 list-inside list-disc space-y-2 text-sm sm:text-base">
          <li>With service providers who assist us in operating our platform</li>
          <li>When required by law or to protect our rights</li>
          <li>In connection with a business transfer or merger</li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Data Security</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          We have put in place appropriate security measures to prevent your
          personal data from being accidentally lost, used or accessed in an
          unauthorized way, altered or disclosed. We use industry-standard
          encryption and secure servers to protect your data.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Data Retention</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          We retain your information for as long as your account is active or as
          needed to provide services. You may request deletion of your account
          and data at any time.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Cookies</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          We use cookies and similar tracking technologies to track activity on
          our service and hold certain information. You can instruct your browser
          to refuse all cookies or to indicate when a cookie is being sent.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Third-Party Services</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          We may employ third-party companies and services for:
        </p>
        <ul className="ml-4 list-inside list-disc space-y-2 text-sm sm:text-base">
          <li>Authentication and security services</li>
          <li>Analytics and performance monitoring</li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed sm:text-base">
          These third parties have access to your personal data only to perform
          these tasks on our behalf and are obligated not to disclose or use it
          for any other purpose.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Children&apos;s Privacy</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          Our Service is not intended for children under 13 years of age. We do
          not knowingly collect personal information from children under 13.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Your Rights</h4>
        <p className="text-sm leading-relaxed sm:text-base">You have the right to:</p>
        <ul className="ml-4 list-inside list-disc space-y-2 text-sm sm:text-base">
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
        <h4>Changes to This Policy</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          We may update our Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h4>Contact Us</h4>
        <p className="text-sm leading-relaxed sm:text-base">
          If you have any questions about this Privacy Policy, please contact us
          through our support channels.
        </p>
      </div>
    </div>
  );
}
