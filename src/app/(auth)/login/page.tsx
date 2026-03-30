"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chrome, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const next = searchParams.get("next") ?? "/home";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-card animate-fade-up">
      {/* Logo */}
      <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white">
          <Layers className="h-4 w-4 text-black" strokeWidth={2.5} />
        </div>
        <span className="text-[16px] font-semibold text-white">Nexus</span>
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
      <p className="text-sm text-text-secondary mb-8">
        Sign in to your AI automation workspace.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button
        onClick={handleGoogleSignIn}
        variant="outline"
        size="lg"
        className="w-full gap-3"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Chrome className="h-4.5 w-4.5" />
        )}
        {loading ? "Redirecting..." : "Continue with Google"}
      </Button>

      <div className="mt-6 rounded-xl border border-white/5 bg-white/3 px-4 py-3">
        <p className="text-xs text-text-muted text-center">
          Email/password login is temporarily unavailable.
          <br />
          Please use Google Sign-In.
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-text-muted">
        By signing in, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-white/10 bg-surface p-8 shadow-card flex items-center justify-center min-h-[280px]">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
