import type { Metadata } from "next";
import { PricingSection } from "@/components/landing/PricingSection";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for individuals and teams.",
};

export default function PricingPage() {
  return (
    <div className="pt-24">
      <div className="text-center py-16 px-6">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mx-auto">
          Start free. Upgrade when you&apos;re ready. No hidden fees.
        </p>
      </div>
      <PricingSection compact />

      {/* FAQ */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Frequently asked questions
          </h2>
          {[
            {
              q: "What file formats do you support?",
              a: "MP3, MP4, WAV, M4A, MOV, and WebM — up to 50MB per file.",
            },
            {
              q: "Do you store my audio files?",
              a: "No. Your audio/video file is deleted immediately after transcription. Only the transcript text and summary are saved.",
            },
            {
              q: "What's the difference between the 8B and 70B models?",
              a: "The 70B model produces more detailed, nuanced summaries with better context understanding. The 8B model is faster and ideal for shorter meetings.",
            },
            {
              q: "When will payments be available?",
              a: "Upgrade and billing features are coming soon. For now, you can enjoy the Free plan with no credit card required.",
            },
          ].map((faq, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/3 p-6">
              <h3 className="text-sm font-semibold text-white mb-2">{faq.q}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
