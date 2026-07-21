import type { Metadata } from "next";
import Features12 from "@/modules/shared/components/features-12";
import FinalCta from "@/modules/shared/components/final-cta";
import HeroSection from "@/modules/shared/components/hero-section";
import InsightReveal from "@/modules/shared/components/insight-reveal";
import Team from "@/modules/shared/components/team";
import Testimonials from "@/modules/shared/components/testimonials";
import TrustMarquee from "@/modules/shared/components/trust-marquee";
import { METADATA } from "@/modules/shared/constants";

export const metadata: Metadata = METADATA.default;

export default function HomePage() {
  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <HeroSection />
      <TrustMarquee />
      <Features12 />
      <InsightReveal />
      <Testimonials />
      <Team />
      <FinalCta />
    </main>
  );
}
