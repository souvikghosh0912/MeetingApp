"use client";

import { useState, useCallback } from "react";
import { Copy, Download, Check } from "lucide-react";
import { StudyPageSummary } from "@/types";

// ─── Panel header ─────────────────────────────────────────────────────────────

export function PanelHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between mb-3">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/40">
        {title}
      </h2>
      {children && <div className="flex items-center gap-1">{children}</div>}
    </div>
  );
}

// ─── Generic icon button ──────────────────────────────────────────────────────

export function IconBtn({
  id,
  onClick,
  title,
  children,
}: {
  id: string;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      title={title}
      className="rounded-md border border-transparent p-1.5 text-white/40 transition-all duration-150 hover:border-white/10 hover:bg-white/10 hover:text-white/80 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
    >
      {children}
    </button>
  );
}

// ─── Copy-to-clipboard button with transient confirmation ────────────────────

export function CopyButton({
  id,
  getText,
}: {
  id: string;
  getText: () => string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[CopyButton] clipboard write failed:", err);
    }
  };

  return (
    <IconBtn
      id={id}
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </IconBtn>
  );
}

// ─── Export summary as .md file ───────────────────────────────────────────────

export function useExportSummary(summary: StudyPageSummary | null) {
  return useCallback(() => {
    if (!summary) return;

    const sections: string[] = [
      "# Study Summary\n",
      "## Key Concepts\n",
      ...(summary.key_concepts?.map((c) => `- ${c}`) ?? ["_None_"]),
      "\n## Summary\n",
      summary.summary ?? "_No summary._",
      "\n## Study Tasks\n",
      ...(summary.action_items?.map(
        (a) => `- [${a.priority.toUpperCase()}] ${a.task}`
      ) ?? ["_None_"]),
    ];

    const blob = new Blob([sections.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "study-summary.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [summary]);
}

// ─── Derive plain-text representation for Copy on the summary pane ───────────

export function summaryToPlainText(summary: StudyPageSummary): string {
  const lines: string[] = [
    "KEY CONCEPTS:",
    ...(summary.key_concepts?.map((c) => `• ${c}`) ?? []),
    "",
    "SUMMARY:",
    summary.summary ?? "",
    "",
    "STUDY TASKS:",
    ...(summary.action_items?.map(
      (a) => `• [${a.priority.toUpperCase()}] ${a.task}`
    ) ?? []),
  ];
  return lines.join("\n");
}

// ─── Download button for summary ─────────────────────────────────────────────

export function ExportButton({ summary }: { summary: StudyPageSummary | null }) {
  const exportSummary = useExportSummary(summary);
  if (!summary) return null;
  return (
    <IconBtn id="export-summary-btn" onClick={exportSummary} title="Export as Markdown (.md)">
      <Download className="h-3.5 w-3.5" />
    </IconBtn>
  );
}
