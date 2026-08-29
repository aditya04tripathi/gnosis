import type { Metadata } from "next";
import { PrivacyContent } from "@/modules/shared/components/legal/privacy-content";
import { LEGAL, METADATA } from "@/modules/shared/constants";

export const metadata: Metadata = METADATA.pages.privacy;

export default function AppPrivacyPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {LEGAL.privacy.lastUpdated(new Date().toLocaleDateString())}
        </p>
      </div>
      <PrivacyContent />
    </div>
  );
}
