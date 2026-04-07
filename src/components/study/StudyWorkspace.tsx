"use client";

import { useRef, useState, useCallback } from "react";
import { StudyPageSummary } from "@/types";
import { StudySummaryView } from "@/components/study/StudySummaryView";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SelectionTooltip, SelectionTooltipPosition } from "@/components/study/SelectionTooltip";
import { ExplanationPopover } from "@/components/study/ExplanationPopover";
import { AnnotationsPanel, AnnotationsBadge } from "@/components/study/AnnotationsPanel";
import { PanelHeader, CopyButton, ExportButton, summaryToPlainText } from "@/components/study/WorkspaceUI";
import { useAnnotations } from "@/hooks/useAnnotations";

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudyWorkspaceProps {
  studyPageId: string;
  summary: StudyPageSummary | null;
  extractedText: string | null;
  imageUrl?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudyWorkspace({
  studyPageId,
  summary,
  extractedText,
  imageUrl,
}: StudyWorkspaceProps) {
  const textPaneRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<SelectionTooltipPosition | null>(null);
  const [explanation, setExplanation] = useState<SelectionTooltipPosition | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(false);

  const { annotations, addAnnotation, deleteAnnotation } = useAnnotations(studyPageId);

  // ── Text selection detector ────────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || text.length < 3) {
      setTooltip(null);
      return;
    }

    const range = selection!.getRangeAt(0);
    if (!textPaneRef.current?.contains(range.commonAncestorContainer)) {
      setTooltip(null);
      return;
    }

    const selRect = range.getBoundingClientRect();
    const paneRect = textPaneRef.current!.getBoundingClientRect();

    setTooltip({
      // Centre horizontally over the selection, 8px above
      x: selRect.left - paneRect.left + selRect.width / 2,
      y: selRect.top - paneRect.top - 8,
      selectedText: text,
    });
  }, []);

  const dismissTooltip = useCallback(() => {
    setTooltip(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleExplain = useCallback(() => {
    if (!tooltip) return;
    setExplanation(tooltip);
    setTooltip(null);
    // Keep the selection visible while explanation loads
  }, [tooltip]);

  const dismissExplanation = useCallback(() => {
    setExplanation(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleSaveAnnotation = useCallback(
    (selectedText: string, note: string) => {
      addAnnotation(selectedText, note);
      setTooltip(null);
      setShowAnnotations(true);
      window.getSelection()?.removeAllRanges();
    },
    [addAnnotation]
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-[calc(100vh-14rem)] min-h-[600px] mt-4 rounded-xl border border-white/10 bg-black/20 shadow-lg overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="w-full h-full">

        {/* ── Left panel: Source image + OCR text ────────────────────────── */}
        <ResizablePanel defaultSize="50%" minSize="25%">
          <div
            ref={textPaneRef}
            className="relative flex h-full flex-col space-y-5 overflow-y-auto p-6 custom-scrollbar bg-white/[0.01]"
            onMouseUp={handleMouseUp}
          >
            {/* Selection tooltip */}
            {tooltip && (
              <SelectionTooltip
                position={tooltip}
                onSave={handleSaveAnnotation}
                onExplain={handleExplain}
                onDismiss={dismissTooltip}
              />
            )}

            {/* Explanation popover */}
            {explanation && (
              <ExplanationPopover
                position={explanation}
                documentContext={extractedText}
                onDismiss={dismissExplanation}
              />
            )}

            {/* Source image */}
            {imageUrl && (
              <div className="flex flex-col space-y-3 shrink-0">
                <PanelHeader title="Source Image" />
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Original study page"
                    className="w-full object-contain max-h-[40vh]"
                  />
                </div>
              </div>
            )}

            {/* Extracted text */}
            <div className="flex min-h-0 flex-1 flex-col space-y-3">
              <PanelHeader title="Extracted Text">
                <CopyButton id="copy-text-btn" getText={() => extractedText ?? ""} />
                <AnnotationsBadge
                  count={annotations.length}
                  onClick={() => setShowAnnotations((v) => !v)}
                />
              </PanelHeader>

              {/* Annotations list */}
              {showAnnotations && (
                <AnnotationsPanel
                  annotations={annotations}
                  onDelete={deleteAnnotation}
                  onClose={() => setShowAnnotations(false)}
                />
              )}

              <div className="flex-1 overflow-y-auto rounded-xl border border-white/5 bg-white/5 p-5 shadow-inner custom-scrollbar">
                <pre className="select-text cursor-text whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-white/70">
                  {extractedText || "No text extracted."}
                </pre>
              </div>
            </div>
          </div>
        </ResizablePanel>

        {/* ── Resize handle ───────────────────────────────────────────────── */}
        <ResizableHandle withHandle />

        {/* ── Right panel: AI Summary ─────────────────────────────────────── */}
        <ResizablePanel defaultSize="50%" minSize="25%">
          <div className="flex h-full flex-col space-y-4 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-white/[0.02] shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)]">
            <PanelHeader title="AI Summary & Insights">
              {summary && (
                <>
                  <CopyButton
                    id="copy-summary-btn"
                    getText={() => summaryToPlainText(summary)}
                  />
                  <ExportButton summary={summary} />
                </>
              )}
            </PanelHeader>

            {summary ? (
              <StudySummaryView summary={summary} />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/3 p-6 shadow-inner">
                <p className="text-sm italic text-white/40">No summary available.</p>
              </div>
            )}
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}
