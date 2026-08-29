import type { Metadata } from "next";
import { TermsContent } from "@/modules/shared/components/legal/terms-content";
import { LEGAL, METADATA } from "@/modules/shared/constants";

export const metadata: Metadata = METADATA.pages.terms;

export default function AppTermsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1>Terms and Conditions</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {LEGAL.terms.lastUpdated(new Date().toLocaleDateString())}
        </p>
      </div>
      <TermsContent />
    </div>
  );
}
