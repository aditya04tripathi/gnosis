import type { Metadata } from "next";
import Features12 from "@/components/features-12";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero-section";
import PricingComponent from "@/components/pricing";
import Team from "@/components/team";
import Testimonials from "@/components/testimonials";

export const metadata: Metadata = {
  title: "Startup Validator - AI-Powered Startup Idea Validation",
  description:
    "Validate your startup ideas with AI-powered analysis. Get detailed feedback, project plans, and actionable insights to bring your idea to life.",
  openGraph: {
    title: "Startup Validator - AI-Powered Startup Idea Validation",
    description: "Validate your startup ideas with AI-powered analysis",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Validator",
    description: "Validate your startup ideas with AI-powered analysis",
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <Features12 />
        <PricingComponent onHomePage />
        <Testimonials />
        <Team />
      </main>
      <Footer />
    </div>
  );
}
