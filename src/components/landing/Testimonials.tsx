const testimonials = [
  {
    quote:
      "We replaced Otter, Notion AI, and our old ATS with Nexus. The hiring workflow alone saves us 3 hours per candidate batch.",
    name: "Priya Sharma",
    title: "Head of People, Contour Labs",
    avatar: "P",
    accentColor: "bg-violet-400/20 text-violet-400",
  },
  {
    quote:
      "The AI workflow generator is genuinely mind-blowing. I described our lead qualification process in plain English and it built the automation in 30 seconds.",
    name: "Arjun Mehta",
    title: "Founder, ScaleStack",
    avatar: "A",
    accentColor: "bg-blue-400/20 text-blue-400",
  },
  {
    quote:
      "Meeting Intelligence pays for itself every Monday. Our team stopped writing meeting notes entirely — Nexus handles it better than we ever did.",
    name: "Riya Verma",
    title: "Engineering Manager, Bytewave",
    avatar: "R",
    accentColor: "bg-emerald-400/20 text-emerald-400",
  },
  {
    quote:
      "Tasks auto-created from my meetings. Action items assigned to the right person. I feel like I hired an EA — for ₹599 a month.",
    name: "Souvik Das",
    title: "Startup Founder",
    avatar: "S",
    accentColor: "bg-amber-400/20 text-amber-400",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 px-6 border-t border-white/[0.05]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Teams that made the switch
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-white/15 hover:bg-white/[0.04] transition-all duration-200"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-[14px] text-text-secondary leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-[13px] font-bold ${t.accentColor}`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">{t.name}</p>
                  <p className="text-[12px] text-text-muted">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
