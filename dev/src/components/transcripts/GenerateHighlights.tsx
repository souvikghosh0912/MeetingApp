"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function GenerateHighlights({ transcriptId }: { transcriptId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function generate() {
      try {
        const res = await fetch("/api/highlights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcriptId }),
        });
        
        if (!res.ok) {
          throw new Error("Failed to generate highlights");
        }
        
        // Refresh the page to show the new highlights
        router.refresh();
      } catch (err: any) {
        setError(err.message || "An error occurred");
      }
    }
    
    generate();
  }, [transcriptId, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p className="text-red-400 font-medium mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-24 bg-white/5 border border-white/10 rounded-2xl">
      <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Generating Highlight Reel</h3>
      <p className="text-sm text-text-muted text-center max-w-sm">
        Our AI is scanning the transcript to pinpoint the exact timestamps of key decisions and action items...
      </p>
    </div>
  );
}
