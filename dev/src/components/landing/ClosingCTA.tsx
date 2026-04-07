"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ClosingCTA() {
  const router = useRouter();

  const handleGetStarted = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    router.push(user ? "/dashboard" : "/login");
  };

  return (
    <section className="py-24 px-6 border-t border-white/[0.05]">
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white mb-8 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
          <Layers className="h-7 w-7 text-black" strokeWidth={2} />
        </div>

        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-5">
          Your AI workspace
          <br />is waiting.
        </h2>
        <p className="text-[16px] text-text-secondary mb-10 max-w-md mx-auto leading-relaxed">
          Start for free today. No credit card. No onboarding call. Just sign in and start automating.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-white text-black text-[15px] font-semibold px-7 py-3.5 hover:bg-white/90 transition-all group shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            Get started — it&apos;s free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
        <p className="mt-5 text-[12px] text-text-muted">
          Trusted by 500+ teams · 4.9★ average rating
        </p>
      </div>
    </section>
  );
}
