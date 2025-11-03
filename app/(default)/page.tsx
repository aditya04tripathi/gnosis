import type { Metadata } from "next";
import PricingComponent from "@/modules/payment/components/pricing";
import Features12 from "@/modules/shared/components/features-12";
import HeroSection from "@/modules/shared/components/hero-section";
import Team from "@/modules/shared/components/team";
import Testimonials from "@/modules/shared/components/testimonials";
import { METADATA } from "@/modules/shared/constants";

export const metadata: Metadata = METADATA.default;

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <Features12 />
        <section id="pricing">
          <PricingComponent onHomePage />
        </section>
        <Testimonials />
        <Team />
      </main>
    </div>
  );
}
