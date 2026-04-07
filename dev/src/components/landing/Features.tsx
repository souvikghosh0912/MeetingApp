import {
  Mic, BrainCircuit, GitBranch, CheckSquare, FileSearch, Layers,
  ArrowRight, Zap, Users, Clock, BarChart3, Target, Sparkles
} from "lucide-react";

/* ── Tool showcase data ─────────────────────────────────────── */
const tools = [
  {
    id: "meeting",
    badge: "Meeting Intelligence",
    badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    headline: "Every meeting, summarized in seconds.",
    description:
      "Drop any audio or video file. Nexus transcribes with Whisper v3, then extracts TL;DRs, action items, key decisions, and sentiment — structured for your team.",
    icon: Mic,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    accent: "blue",
    features: [
      { icon: Zap, text: "Transcription in under 60 seconds" },
      { icon: Users, text: "Speaker diarization & naming" },
      { icon: BarChart3, text: "Sentiment & topic visualizations" },
      { icon: Clock, text: "Interactive highlights with timestamps" },
    ],
    mockContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[11px] text-blue-400 font-medium uppercase tracking-widest">Processing complete</span>
        </div>
        {["Q3 roadmap priorities narrowed to 3 items", "Design sprint approved for checkout flow", "Backend team to deliver API by Friday"].map((item, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
            <div className="mt-0.5 h-4 w-4 rounded-sm border border-blue-400/40 bg-blue-400/10 flex items-center justify-center flex-shrink-0">
              <div className="h-1.5 w-1.5 rounded-sm bg-blue-400" />
            </div>
            <span className="text-[12px] text-white/70 leading-snug">{item}</span>
          </div>
        ))}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] text-white/30">4 speakers · 47 min · 3 decisions</span>
          <span className="text-[11px] text-blue-400 cursor-pointer hover:underline">View full →</span>
        </div>
      </div>
    ),
  },
  {
    id: "resume",
    badge: "Resume Screener",
    badgeColor: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    headline: "Hire smarter. Screen 100 resumes in one click.",
    description:
      "Paste your job description. Upload a batch of resumes. Nexus ranks every candidate against your criteria, highlights red flags, and drafts interview questions — instantly.",
    icon: FileSearch,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-400/10",
    accent: "violet",
    features: [
      { icon: Target, text: "Match score against job requirements" },
      { icon: Sparkles, text: "Auto-generated interview questions" },
      { icon: Users, text: "Ranked candidate shortlist" },
      { icon: Zap, text: "Bulk screening in seconds" },
    ],
    mockContent: (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-white/40 uppercase tracking-widest">Candidates · Senior Engineer</span>
          <span className="text-[11px] text-violet-400">24 screened</span>
        </div>
        {[
          { name: "Arjun Mehta", score: 94, tag: "Strong match", tagColor: "text-emerald-400 bg-emerald-400/10" },
          { name: "Sarah Chen", score: 88, tag: "Good match", tagColor: "text-blue-400 bg-blue-400/10" },
          { name: "Marcus T.", score: 71, tag: "Partial match", tagColor: "text-amber-400 bg-amber-400/10" },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
            <div className="h-7 w-7 rounded-full bg-white/[0.07] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white/80">{c.name}</p>
              <div className="h-1 w-full rounded-full bg-white/[0.07] mt-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-violet-400" style={{ width: `${c.score}%` }} />
              </div>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.tagColor}`}>{c.tag}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "workflow",
    badge: "AI Workflow Generator",
    badgeColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    headline: "Describe it in plain English. Get a full workflow.",
    description:
      "Just say what you want to automate. Nexus generates multi-step workflows — with branches, conditions, and integrations — that you can deploy or modify with a click.",
    icon: GitBranch,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
    accent: "emerald",
    features: [
      { icon: BrainCircuit, text: "Natural language to workflow" },
      { icon: GitBranch, text: "Branching logic & conditionals" },
      { icon: Zap, text: "One-click deploy" },
      { icon: Layers, text: "Connect any tool or API" },
    ],
    mockContent: (
      <div className="space-y-3">
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
          <p className="text-[11px] text-white/40 mb-1">Prompt</p>
          <p className="text-[12px] text-white/70 italic">&ldquo;When a new lead fills the form, score them, send a Slack alert, and add to CRM&rdquo;</p>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <Sparkles className="h-3 w-3 text-emerald-400" />
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
        {[
          { step: "01", label: "Form submitted", color: "border-emerald-400/30 bg-emerald-400/5" },
          { step: "02", label: "AI scores lead quality", color: "border-emerald-400/30 bg-emerald-400/5" },
          { step: "03", label: "IF score > 70 → Slack #sales", color: "border-emerald-400/30 bg-emerald-400/5" },
          { step: "04", label: "Add contact to HubSpot CRM", color: "border-emerald-400/30 bg-emerald-400/5" },
        ].map((s) => (
          <div key={s.step} className={`flex items-center gap-3 rounded-lg border ${s.color} px-3 py-2`}>
            <span className="text-[10px] font-black text-emerald-400/50 w-4">{s.step}</span>
            <span className="text-[12px] text-white/70">{s.label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "tasks",
    badge: "AI-Powered Tasks",
    badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    headline: "Tasks that plan themselves.",
    description:
      "Nexus reads your meetings, workflows, and docs — then automatically creates tasks, assigns them to owners, sets priorities, and tracks completion across your whole team.",
    icon: CheckSquare,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10",
    accent: "amber",
    features: [
      { icon: BrainCircuit, text: "Auto-extract tasks from meetings" },
      { icon: Users, text: "Smart owner assignment" },
      { icon: Target, text: "Priority & deadline suggestions" },
      { icon: BarChart3, text: "Team progress dashboard" },
    ],
    mockContent: (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-white/40 uppercase tracking-widest">This week</span>
          <span className="text-[11px] text-amber-400">6/9 done</span>
        </div>
        {[
          { task: "Finalize checkout API", owner: "Riya", priority: "High", done: true },
          { task: "Send proposal to Acme", owner: "Souvik", priority: "High", done: true },
          { task: "Design sprint kickoff", owner: "Priya", priority: "Med", done: false },
          { task: "Update investor deck", owner: "Anish", priority: "Low", done: false },
        ].map((t, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${t.done ? "border-white/[0.04] opacity-50" : "border-white/[0.08] bg-white/[0.02]"}`}>
            <div className={`h-3.5 w-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center ${t.done ? "border-amber-400/50 bg-amber-400/20" : "border-white/20"}`}>
              {t.done && <div className="h-1.5 w-1.5 rounded-sm bg-amber-400" />}
            </div>
            <span className={`flex-1 text-[12px] ${t.done ? "line-through text-white/30" : "text-white/70"}`}>{t.task}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.priority === "High" ? "text-red-400 bg-red-400/10" : t.priority === "Med" ? "text-amber-400 bg-amber-400/10" : "text-white/30 bg-white/5"}`}>
              {t.priority}
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

/* ── Stats row ─────────────────────────────────────────────── */
const stats = [
  { value: "10×", label: "faster hiring decisions" },
  { value: "4 hrs", label: "saved per team per week" },
  { value: "100%", label: "automated follow-ups" },
  { value: "< 60s", label: "to process a meeting" },
];

export function Features() {
  return (
    <>
      {/* ── Stats bar ── */}
      <section className="border-t border-b border-white/[0.05] py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.value} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-1">{s.value}</p>
              <p className="text-[13px] text-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tools section ── */}
      <section className="py-24 px-6" id="tools">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-3">What&apos;s inside Nexus</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Four tools. One workspace.
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Every AI capability your team needs — without the chaos of stitching together five different apps.
            </p>
          </div>

          {/* Tool showcases */}
          <div className="space-y-28" id="features">
            {tools.map((tool, idx) => {
              const Icon = tool.icon;
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={tool.id}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${!isEven ? "lg:flex-row-reverse" : ""}`}
                >
                  {/* Copy */}
                  <div className={!isEven ? "lg:order-2" : ""}>
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold mb-5 ${tool.badgeColor}`}>
                      <Icon className="h-3 w-3" />
                      {tool.badge}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4 leading-snug">
                      {tool.headline}
                    </h3>
                    <p className="text-[15px] text-text-secondary leading-relaxed mb-7">
                      {tool.description}
                    </p>
                    <ul className="space-y-3">
                      {tool.features.map(({ icon: FIcon, text }) => (
                        <li key={text} className="flex items-center gap-3 text-[14px] text-text-secondary">
                          <div className={`h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 ${tool.iconBg}`}>
                            <FIcon className={`h-3.5 w-3.5 ${tool.iconColor}`} />
                          </div>
                          {text}
                        </li>
                      ))}
                    </ul>
                    <button className="mt-8 inline-flex items-center gap-2 text-[13.5px] font-medium text-white hover:text-white/70 transition-colors group">
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>

                  {/* Mock UI */}
                  <div className={!isEven ? "lg:order-1" : ""}>
                    <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                      {/* Header bar */}
                      <div className="flex items-center gap-2 mb-5">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${tool.iconBg}`}>
                          <Icon className={`h-3.5 w-3.5 ${tool.iconColor}`} />
                        </div>
                        <span className="text-[12px] font-semibold text-white/70">{tool.badge}</span>
                      </div>
                      {tool.mockContent}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Integration strip ── */}
      <section className="py-16 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-3">Integrations</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Connects with tools you already use</h2>
          <p className="text-[15px] text-text-secondary mb-10">Slack, Notion, Google Drive, HubSpot, Jira, and 50+ more.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["Slack", "Notion", "Google Drive", "HubSpot", "Jira", "Salesforce", "Linear", "Zapier"].map((app) => (
              <div key={app} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-white/50 hover:text-white/70 hover:border-white/15 transition-all cursor-default">
                {app}
              </div>
            ))}
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-[13px] text-text-muted">
              +50 more
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
