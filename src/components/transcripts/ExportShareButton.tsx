"use client";

import { useState, useRef } from "react";
import {
  Download, Share2, Link2, Check, FileText,
  Loader2, ChevronDown, Copy, Trash2, BookOpen, File
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Transcript } from "@/types";
import { toast } from "sonner";

/* ── Markdown serialiser ─────────────────────────────────────── */
function buildMarkdown(t: Transcript): string {
  const s = t.summary;
  if (!s) return `# ${t.title}\n\nNo summary available.`;

  const lines: string[] = [
    `# ${t.title}`,
    ``,
    `> **Date:** ${new Date(t.created_at).toLocaleDateString()}  `,
    `> **Sentiment:** ${s.sentiment}`,
    ``,
  ];

  if (s.tldr.length) {
    lines.push(`## TL;DR`, ``);
    s.tldr.forEach((p) => lines.push(`- ${p}`));
    lines.push(``);
  }

  if (s.decisions.length) {
    lines.push(`## Decisions Made`, ``);
    s.decisions.forEach((d) => lines.push(`- ${d}`));
    lines.push(``);
  }

  if (s.action_items.length) {
    lines.push(`## Action Items`, ``);
    s.action_items.forEach((a) =>
      lines.push(`- [ ] **${a.priority.toUpperCase()}** — ${a.task}${a.owner ? ` *(${a.owner})*` : ""}`)
    );
    lines.push(``);
  }

  if (s.topics.length) {
    lines.push(`## Key Topics`, ``);
    s.topics.forEach((tp) => {
      lines.push(`### ${tp.name}`);
      lines.push(tp.summary);
      lines.push(``);
    });
  }

  if (t.transcript_text) {
    lines.push(`---`, `## Full Transcript`, ``, t.transcript_text);
  }

  return lines.join("\n");
}

/* ── Notion export via copy ─────────────────────────────────── */
function buildNotionText(t: Transcript): string {
  // Notion-paste-friendly format (rich text blocks as plain text)
  return buildMarkdown(t);
}

interface ExportShareButtonProps {
  transcript: Transcript;
}

type MenuState = "idle" | "export" | "share";

export function ExportShareButton({ transcript }: ExportShareButtonProps) {
  const [menu, setMenu] = useState<MenuState>("idle");
  // Pre-seed from the transcript prop if already shared
  const [shareToken, setShareToken] = useState<string | null>(transcript.share_token ?? null);
  const [shareLoading, setShareLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setMenu("idle");

  /* ── Copy Markdown ── */
  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(buildMarkdown(transcript));
    toast.success("Markdown copied to clipboard");
    closeMenu();
  };

  /* ── Copy Notion ── */
  const handleCopyNotion = async () => {
    await navigator.clipboard.writeText(buildNotionText(transcript));
    toast.success("Copied — paste directly into Notion");
    closeMenu();
  };

  /* ── Download .md file ── */
  const handleDownloadMd = () => {
    const blob = new Blob([buildMarkdown(transcript)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${transcript.title.replace(/[^a-z0-9]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown file downloaded");
    closeMenu();
  };

  /* ── Export PDF ── */
  const handleExportPdf = async () => {
    setPdfLoading(true);
    closeMenu();
    try {
      const { default: jsPDF } = await import("jspdf");
      const md = buildMarkdown(transcript);

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 18;
      const maxW = pageW - margin * 2;
      let y = margin;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 15, 15);
      const titleLines = doc.splitTextToSize(transcript.title, maxW);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 8 + 4;

      // Meta
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `${new Date(transcript.created_at).toLocaleDateString()} · ${transcript.summary?.sentiment ?? ""} sentiment`,
        margin, y
      );
      y += 10;

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      // Body — parse markdown sections
      const lines = md.split("\n");
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = margin; }

        if (line.startsWith("# ")) { /* already done */ continue; }
        if (line.startsWith("## ")) {
          y += 4;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(20, 20, 20);
          doc.text(line.replace("## ", ""), margin, y);
          y += 7;
        } else if (line.startsWith("### ")) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          doc.text(line.replace("### ", ""), margin, y);
          y += 5.5;
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          const bullet = doc.splitTextToSize(`• ${line.slice(2)}`, maxW - 4);
          doc.text(bullet, margin + 3, y);
          y += bullet.length * 4.5;
        } else if (line.startsWith("> ")) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const quoted = doc.splitTextToSize(line.replace("> ", ""), maxW - 6);
          doc.text(quoted, margin + 6, y);
          y += quoted.length * 4.5;
        } else if (line.startsWith("---")) {
          doc.setDrawColor(220, 220, 220);
          doc.line(margin, y, pageW - margin, y);
          y += 6;
        } else if (line.trim()) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          const wrapped = doc.splitTextToSize(line, maxW);
          doc.text(wrapped, margin, y);
          y += wrapped.length * 4.5;
        } else {
          y += 3;
        }
      }

      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text("Generated by Nexus · nexus.ai", margin, 290);
        doc.text(`${i} / ${pageCount}`, pageW - margin - 8, 290);
      }

      const fileName = `${transcript.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      doc.save(fileName);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  /* ── Generate share link ── */
  const handleGenerateLink = async () => {
    setShareLoading(true);
    try {
      const res = await fetch(`/api/transcripts/${transcript.id}/share`, { method: "POST" });
      const data = await res.json();
      if (data.token) setShareToken(data.token);
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setShareLoading(false);
    }
  };

  /* ── Copy share link ── */
  const handleCopyLink = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Revoke share link ── */
  const handleRevokeLink = async () => {
    await fetch(`/api/transcripts/${transcript.id}/share`, { method: "DELETE" });
    setShareToken(null);
    toast.success("Share link revoked");
  };

  return (
    <div className="relative flex items-center gap-2" ref={containerRef}>
      {/* Export button */}
      <div className="relative">
        <button
          onClick={() => setMenu(menu === "export" ? "idle" : "export")}
          disabled={pdfLoading}
          className="flex items-center gap-2 h-8 rounded-[8px] border border-white/[0.1] bg-white/[0.03] px-3 text-[12.5px] font-medium text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all"
        >
          {pdfLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export
          <ChevronDown className={cn("h-3 w-3 transition-transform", menu === "export" && "rotate-180")} />
        </button>

        {menu === "export" && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-[10px] border border-white/[0.08] bg-[#141414] shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="p-1">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest">Export as</p>
                {[
                  { icon: File, label: "PDF Document", action: handleExportPdf },
                  { icon: FileText, label: "Markdown file (.md)", action: handleDownloadMd },
                  { icon: Copy, label: "Copy as Markdown", action: handleCopyMarkdown },
                  { icon: BookOpen, label: "Copy for Notion", action: handleCopyNotion },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full flex items-center gap-2.5 rounded-[7px] px-3 py-2 text-[12.5px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors text-left"
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Share button */}
      <div className="relative">
        <button
          onClick={() => setMenu(menu === "share" ? "idle" : "share")}
          className="flex items-center gap-2 h-8 rounded-[8px] border border-white/[0.1] bg-white/[0.03] px-3 text-[12.5px] font-medium text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
          <ChevronDown className={cn("h-3 w-3 transition-transform", menu === "share" && "rotate-180")} />
        </button>

        {menu === "share" && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-[10px] border border-white/[0.08] bg-[#141414] shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="p-4">
                <p className="text-[13px] font-semibold text-white mb-1">Share meeting</p>
                <p className="text-[12px] text-white/40 mb-4">
                  Generate a public, read-only link to this summary.
                </p>

                {!shareToken ? (
                  <button
                    onClick={handleGenerateLink}
                    disabled={shareLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-white text-black text-[13px] font-semibold py-2 hover:bg-white/90 transition-colors"
                  >
                    {shareLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Link2 className="h-3.5 w-3.5" />
                    )}
                    Generate public link
                  </button>
                ) : (
                  <div className="space-y-2">
                    {/* Link display */}
                    <div className="flex items-center gap-2 rounded-[8px] border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                      <Link2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="flex-1 text-[11px] text-white/50 truncate">
                        {typeof window !== "undefined" ? window.location.origin : ""}/share/{shareToken}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-[7px] bg-white text-black text-[12px] font-semibold py-2 hover:bg-white/90 transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Copy link"}
                      </button>
                      <button
                        onClick={handleRevokeLink}
                        className="flex items-center justify-center rounded-[7px] border border-red-500/20 bg-red-500/10 text-red-400 px-3 hover:bg-red-500/20 transition-colors"
                        title="Revoke link"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-white/25 text-center">
                      Anyone with this link can view the summary
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
