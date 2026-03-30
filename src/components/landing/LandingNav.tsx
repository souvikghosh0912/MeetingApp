"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#tools", label: "Tools" },
  { href: "/#pricing", label: "Pricing" },
];

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleGetStarted = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    router.push(user ? "/dashboard" : "/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center justify-between px-6 md:px-12 border-b border-white/[0.06] bg-background/75 backdrop-blur-xl">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white">
          <Layers className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold text-white tracking-tight">
          Nexus
        </span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3.5 py-1.5 text-[13.5px] text-text-secondary hover:text-white transition-colors rounded-md hover:bg-white/5"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={handleGetStarted}
          className="text-[13.5px] text-text-secondary hover:text-white transition-colors"
        >
          Sign in
        </button>
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-white text-black text-[13.5px] font-semibold px-4 py-1.5 hover:bg-white/90 transition-colors"
        >
          Get started free →
        </button>
      </div>

      {/* Mobile */}
      <button
        className="md:hidden text-text-secondary hover:text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-[60px] left-0 right-0 border-b border-white/[0.06] bg-background/95 backdrop-blur-xl p-4 flex flex-col gap-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary hover:text-white py-2 px-2 rounded-md hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/[0.06] mt-1 flex flex-col gap-2">
            <button
              onClick={handleGetStarted}
              className="w-full rounded-[8px] bg-white text-black text-sm font-semibold px-4 py-2.5 hover:bg-white/90 transition-colors"
            >
              Get started free
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
