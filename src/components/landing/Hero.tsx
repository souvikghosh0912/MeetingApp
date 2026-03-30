"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const logos = [
  "Acme Corp", "Vertex AI", "TechFlow", "BuildFast", "Launchpad", "Streamline",
];

export function Hero() {
  const router = useRouter();

  const handleGetStarted = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    router.push(user ? "/dashboard" : "/login");
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-[60px] overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-blue-600/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-violet-600/[0.05] blur-[100px] pointer-events-none" />

      {/* Badge */}
      <div className="mb-7 animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm">
          <Sparkles className="h-3 w-3 text-blue-400" />
          Introducing AI-powered workspace automation
        </span>
      </div>

      {/* Headline */}
      <div className="text-center max-w-3xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <h1 className="text-[3.5rem] md:text-[5rem] font-bold tracking-[-0.04em] text-white leading-[1.0] mb-6">
          The AI workspace
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white/80 to-white/20">
            that does the work.
          </span>
        </h1>
        <p className="text-[1.05rem] md:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed font-normal">
          Nexus combines meeting intelligence, resume screening, workflow automation, and AI-powered tasks — in one beautifully simple workspace.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-9 flex flex-col sm:flex-row gap-3 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-white text-black text-[15px] font-semibold px-6 py-3 hover:bg-white/90 transition-all group shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)]"
        >
          Start for free
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] text-white text-[15px] font-medium px-6 py-3 hover:bg-white/[0.07] transition-all backdrop-blur-sm"
        >
          See demo →
        </button>
      </div>
      <p className="mt-4 text-xs text-text-muted animate-fade-up" style={{ animationDelay: "0.25s" }}>
        Free forever · No credit card · 2 min setup
      </p>

      {/* Product preview */}
      <div className="mt-16 w-full max-w-5xl animate-fade-up" style={{ animationDelay: "0.35s" }}>
        <div className="relative rounded-2xl border border-white/[0.08] bg-surface overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#0f0f0f]">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="flex-1 mx-4 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center px-3">
              <span className="text-[11px] text-text-muted">app.nexus.ai/home</span>
            </div>
          </div>

          {/* Dashboard mock */}
          <div className="grid grid-cols-12 min-h-[320px]">
            {/* Sidebar mock */}
            <div className="col-span-2 border-r border-white/[0.05] bg-[#0d0d0d] p-3 hidden md:block">
              <div className="space-y-1">
                {["Home", "Meeting AI", "Workflows", "Tasks", "Hiring AI"].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${i === 0 ? "bg-white/[0.07] text-white" : "text-white/30"}`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-blue-400" : "bg-white/20"}`} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Main area mock */}
            <div className="col-span-12 md:col-span-10 p-6 bg-[#111111]">
              <p className="text-[11px] text-white/30 mb-4 font-medium uppercase tracking-widest">AI Workspace</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: "Meeting Intelligence", color: "bg-blue-500/15 border-blue-500/20", dot: "bg-blue-400", badge: "LIVE" },
                  { name: "Resume Screener", color: "bg-violet-500/15 border-violet-500/20", dot: "bg-violet-400", badge: "LIVE" },
                  { name: "AI Workflow Generator", color: "bg-emerald-500/15 border-emerald-500/20", dot: "bg-emerald-400", badge: "BETA" },
                  { name: "Smart Task Manager", color: "bg-amber-500/15 border-amber-500/20", dot: "bg-amber-400", badge: "NEW" },
                  { name: "Document AI", color: "bg-white/5 border-white/10", dot: "bg-white/30", badge: "SOON" },
                  { name: "Email Drafter", color: "bg-white/5 border-white/10", dot: "bg-white/30", badge: "SOON" },
                ].map((tool) => (
                  <div key={tool.name} className={`rounded-xl border ${tool.color} p-4`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${tool.dot} mb-3`} />
                    <p className="text-[11px] font-medium text-white/80 mb-1">{tool.name}</p>
                    <span className="text-[9px] font-bold text-white/30 tracking-widest">{tool.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social proof logos */}
      <div className="mt-14 w-full max-w-2xl animate-fade-up" style={{ animationDelay: "0.45s" }}>
        <p className="text-center text-[11px] text-text-muted uppercase tracking-widest mb-5">
          Trusted by teams at
        </p>
        <div className="flex items-center justify-center flex-wrap gap-6">
          {logos.map((logo) => (
            <span key={logo} className="text-[13px] font-semibold text-white/15">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
