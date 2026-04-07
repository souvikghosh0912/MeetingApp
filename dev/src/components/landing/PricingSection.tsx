"use client";

import Link from "next/link";
import { Check, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const tiers = [
  {
    name: "Free",
    monthly: "₹0",
    annual: "₹0",
    period: "forever",
    description: "Perfect for solo exploration.",
    highlighted: false,
    features: [
      "Meeting Intelligence (5/month)",
      "Resume Screener (10 resumes/month)",
      "AI Workflow Generator (3 workflows)",
      "Smart Tasks (up to 50)",
      "1 workspace",
      "Google Sign-In",
    ],
    cta: "Start for free",
    href: "/login",
    badge: null,
    roi: null,
  },
  {
    name: "Pro",
    monthly: "₹599",
    annual: "₹399",
    period: "/month",
    description: "For individuals who move fast.",
    highlighted: true,
    features: [
      "Unlimited Meeting Intelligence",
      "Resume Screener (unlimited)",
      "Unlimited AI Workflows",
      "Unlimited Smart Tasks",
      "3 workspaces",
      "Priority AI processing",
      "PDF & Slack exports",
      "Email support",
    ],
    cta: "Start Pro free for 7 days",
    href: "/login",
    badge: "Most popular",
    roi: "ROI: Save 6+ hrs/week",
  },
  {
    name: "Team",
    monthly: "₹1,499",
    annual: "₹999",
    period: "/user/month",
    description: "For teams that run on automation.",
    highlighted: false,
    features: [
      "Everything in Pro",
      "Unlimited team seats",
      "Shared workspaces",
      "Shared billing dashboard",
      "Admin controls & roles",
      "Audit logs",
      "Priority Slack support",
      "Custom AI model selection",
    ],
    cta: "Start team trial",
    href: "/login",
    badge: null,
    roi: "ROI: Replace 2-3 SaaS tools",
  },
];

const faqs = [
  {
    q: "Is the free plan actually useful?",
    a: "Yes — the free plan gives you real access to all four tools with generous monthly limits. No credit card, no trial tricks.",
  },
  {
    q: "What counts as a 'workflow'?",
    a: "Any automation sequence you generate using the AI Workflow Generator. Once built, running that workflow costs nothing extra.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Absolutely. Upgrade, downgrade, or cancel anytime. If you downgrade, you keep Pro features until the end of your billing period.",
  },
  {
    q: "Do you offer custom enterprise pricing?",
    a: "Yes — for teams over 50, we offer custom plans with dedicated infrastructure, SSO, and a success manager. Reach out to us.",
  },
];

export function PricingSection({ compact = false }: { compact?: boolean }) {
  const [annual, setAnnual] = useState(true);

  return (
    <section className={cn("py-24 px-6", compact && "py-16")} id="pricing">
      <div className="max-w-5xl mx-auto">
        {!compact && (
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Simple. Transparent. Worth it.
            </h2>
            <p className="text-text-secondary text-lg max-w-md mx-auto mb-8">
              Start free. Upgrade when Nexus earns its keep — most teams see ROI in the first week.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-sm">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
                  !annual ? "bg-white text-black" : "text-text-secondary hover:text-white"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[13px] font-medium transition-all flex items-center gap-2",
                  annual ? "bg-white text-black" : "text-text-secondary hover:text-white"
                )}
              >
                Annual
                <span className={cn("text-[10px] font-bold rounded-full px-1.5 py-0.5", annual ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-400")}>
                  −33%
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Pricing grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-7 transition-all duration-200",
                tier.highlighted
                  ? "border-white/20 bg-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20px_60px_rgba(0,0,0,0.4)]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
              )}
            >
              {/* Popular badge */}
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white text-black text-[11px] font-bold px-3 py-1">
                    <Zap className="h-3 w-3" fill="currentColor" />
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-7">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-white">{tier.name}</h3>
                  {tier.roi && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                      {tier.roi}
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1.5 mb-2">
                  <span className="text-4xl font-black text-white tracking-tight">
                    {annual ? tier.annual : tier.monthly}
                  </span>
                  <span className="text-text-secondary text-sm mb-1.5">{tier.period}</span>
                </div>
                <p className="text-[13px] text-text-secondary">{tier.description}</p>
              </div>

              {/* CTA */}
              <Link href={tier.href}>
                <button
                  className={cn(
                    "w-full rounded-[9px] py-2.5 text-[14px] font-semibold mb-7 transition-all flex items-center justify-center gap-2 group",
                    tier.highlighted
                      ? "bg-white text-black hover:bg-white/90"
                      : "border border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20"
                  )}
                >
                  {tier.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>

              {/* Features */}
              <div className="border-t border-white/[0.06] pt-6">
                <p className="text-[11px] text-text-muted uppercase tracking-widest mb-4">What&apos;s included</p>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[13px] text-text-secondary">
                      <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Value prop strip */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 mb-16 text-center">
          <p className="text-xl font-semibold text-white mb-2">
            The average Nexus Pro user saves <span className="text-emerald-400">₹8,000/month</span> in tool costs.
          </p>
          <p className="text-[14px] text-text-secondary">
            By replacing Otter.ai (₹1,500), Notion AI (₹2,000), Zapier (₹3,000), and an ATS tool (₹3,500) — all in one workspace.
          </p>
        </div>

        {/* FAQ */}
        {!compact && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white text-center mb-8">Common questions</h3>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-6 py-5">
                  <p className="text-[14px] font-semibold text-white mb-2">{faq.q}</p>
                  <p className="text-[13.5px] text-text-secondary leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
