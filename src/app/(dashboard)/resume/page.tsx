import type { Metadata } from "next";
import { FileSearch, Sparkles, Upload, Users, Target, CheckCircle, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Resume Screener" };

const features = [
  { icon: Upload, label: "Bulk upload resumes", desc: "PDF, DOCX, or plain text — drop up to 50 at once" },
  { icon: Target, label: "AI match scoring", desc: "Every candidate scored against your JD in seconds" },
  { icon: Users, label: "Ranked shortlist", desc: "Top candidates surfaced with reasons and red flags" },
  { icon: Sparkles, label: "Interview question gen", desc: "AI-drafted questions tailored to each candidate" },
];

const mockCandidates = [
  { name: "Arjun Mehta", score: 94, tag: "Strong match", skills: ["React", "Node.js", "AWS"], tagColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  { name: "Sarah Chen", score: 88, tag: "Good match", skills: ["TypeScript", "Python", "Docker"], tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { name: "Marcus T.", score: 71, tag: "Partial fit", skills: ["Java", "SQL", "Git"], tagColor: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  { name: "Priya Sharma", score: 65, tag: "Weak match", skills: ["Vue", "PHP", "MySQL"], tagColor: "text-red-400 bg-red-400/10 border-red-400/20" },
];

export default function ResumeScreenerPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-[8px] bg-violet-400/10 flex items-center justify-center">
            <FileSearch className="h-3.5 w-3.5 text-violet-400" strokeWidth={1.8} />
          </div>
          <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">Resume Screener</span>
        </div>
        <h1 className="text-[26px] font-bold text-white tracking-tight">
          Hire smarter with AI
        </h1>
        <p className="text-[14px] text-white/40 mt-1">
          Paste a job description, upload resumes, and get a ranked shortlist in seconds.
        </p>
      </div>

      {/* ── Coming soon banner ── */}
      <div className="rounded-[14px] border border-violet-400/20 bg-violet-400/[0.04] p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-[10px] bg-violet-400/15 flex items-center justify-center flex-shrink-0">
            <Lock className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-[15px] font-semibold text-white">This tool is in early access</h2>
              <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full">BETA</span>
            </div>
            <p className="text-[13px] text-white/50 mb-4">
              The Resume Screener is being tested internally. You&apos;ll be notified as soon as it&apos;s available on your plan.
            </p>
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 rounded-[8px] bg-violet-400/10 border border-violet-400/20 px-4 py-2 text-[13px] font-medium text-violet-400 hover:bg-violet-400/15 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade for early access
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Feature overview ── */}
      <div>
        <h2 className="text-[13px] font-semibold text-white/50 uppercase tracking-widest mb-5">What you&apos;ll get</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-4 rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <div className="h-8 w-8 rounded-[8px] bg-violet-400/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-violet-400" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white mb-0.5">{label}</p>
                <p className="text-[12px] text-white/35 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Preview UI (blurred) ── */}
      <div className="relative">
        <h2 className="text-[13px] font-semibold text-white/50 uppercase tracking-widest mb-5">Preview</h2>
        <div className="relative rounded-[14px] border border-white/[0.07] bg-[#111111] p-6 overflow-hidden">
          {/* Blur overlay */}
          <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/60 flex items-center justify-center rounded-[14px]">
            <div className="text-center">
              <Lock className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-white/50">Coming soon</p>
              <p className="text-[12px] text-white/25 mt-1">Upgrade to access</p>
            </div>
          </div>

          {/* Fake preview under blur */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[12px] text-white/50 mb-1">Senior Frontend Engineer · 24 screened</p>
              <div className="h-1.5 w-48 rounded-full bg-violet-400/30 overflow-hidden">
                <div className="h-full w-[75%] bg-violet-400 rounded-full" />
              </div>
            </div>
            <span className="text-[11px] text-white/30">Processing complete</span>
          </div>
          <div className="space-y-2.5">
            {mockCandidates.map((c) => (
              <div key={c.name} className="flex items-center gap-4 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-white/[0.07] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-medium text-white">{c.name}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${c.tagColor}`}>{c.tag}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {c.skills.map((s) => (
                      <span key={s} className="text-[10px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center border border-white/10">
                    <span className="text-[11px] font-bold text-white">{c.score}</span>
                  </div>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
