import Link from "next/link";
import { Layers } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Tools: ["Meeting AI", "Resume Screener", "Workflows", "Smart Tasks"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security"],
};

export function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-white">
                <Layers className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-[15px] font-semibold text-white">Nexus</span>
            </div>
            <p className="text-[13px] text-text-muted leading-relaxed">
              The AI automation workspace for modern teams.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-4">
                {section}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-[13px] text-text-secondary hover:text-white transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.05]">
          <p className="text-[12px] text-text-muted">
            © 2025 Nexus, Inc. Built with NVIDIA NIM &amp; Whisper v3.
          </p>
          <div className="flex items-center gap-5 text-[12px] text-text-muted">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
