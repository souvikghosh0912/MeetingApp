import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";
import { LandingNav } from "@/components/landing/LandingNav";
import { ClosingCTA } from "@/components/landing/ClosingCTA";
import { Testimonials } from "@/components/landing/Testimonials";

export const metadata: Metadata = {
  title: "Nexus — The AI Automation Workspace",
  description:
    "Nexus combines meeting intelligence, resume screening, workflow automation, and AI-powered tasks — in one beautifully simple workspace.",
  openGraph: {
    title: "Nexus — The AI Automation Workspace",
    description: "One platform. Every AI workflow.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <Hero />
      <Features />
      <Testimonials />
      <PricingSection />
      <ClosingCTA />
      <Footer />
    </>
  );
}
