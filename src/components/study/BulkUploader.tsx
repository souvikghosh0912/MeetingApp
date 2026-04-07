"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, X, AlertCircle, Files, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, bytesToMb } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ModelType, Plan, BulkPageState } from "@/types";
import { PLAN_LIMITS } from "@/lib/constants";
import { BulkPageProgressList } from "@/components/study/BulkPageProgressList";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILES = 10;
const MIN_FILES = 2;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILE_SIZE_MB = 10;

const MODEL_OPTIONS = [
  { value: "llama-8b" as const,     label: "LLaMA 3.1 8B",  desc: "Fast · Simple concepts" },
  { value: "gpt-oss-20b" as const,  label: "GPT-OSS 20B",   desc: "Balanced · Recommended" },
  { value: "gpt-oss-120b" as const, label: "GPT-OSS 120B",  desc: "Powerful · Complex topics" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface BulkUploaderProps {
  userId: string;
  plan?: Plan;
  defaultModel?: ModelType;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BulkUploader({
  userId,
  plan = "free",
  defaultModel = "gpt-oss-20b",
}: BulkUploaderProps) {
  const limits = PLAN_LIMITS[plan];
  const router = useRouter();

  // Pre-processing file selection
  const [files, setFiles] = useState<File[]>([]);

  // Processing state — populated when the user hits "Process"
  const [bulkPages, setBulkPages] = useState<BulkPageState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Settings
  const [selectedModel, setSelectedModel] = useState<ModelType>(defaultModel);
  const [customInstructions, setCustomInstructions] = useState("");
  const [setTitle, setSetTitle] = useState("");

  const [error, setError] = useState<string | null>(null);

  const hasStarted = bulkPages.length > 0;
  const canProcess = files.length >= MIN_FILES && !hasStarted;

  // ── Dropzone ────────────────────────────────────────────────────────────────

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const combined = [...files, ...acceptedFiles];
      if (combined.length > MAX_FILES) {
        setError(`Max ${MAX_FILES} files allowed. Only the first ${MAX_FILES} were kept.`);
        setFiles(combined.slice(0, MAX_FILES));
      } else {
        setFiles(combined);
      }
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: true,
    disabled: hasStarted || isDone,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  // ── Processing ──────────────────────────────────────────────────────────────

  const handleProcess = async () => {
    if (files.length < MIN_FILES) {
      setError(`Please select at least ${MIN_FILES} files for bulk upload.`);
      return;
    }
    setError(null);

    // Initialise the results array — kept as a local ref so we can mutate
    // it synchronously inside the loop and still drive UI via setBulkPages.
    const results: BulkPageState[] = files.map((f) => ({
      file: f,
      status: "pending" as const,
    }));
    setBulkPages([...results]);

    const supabase = createClient();

    // ── Sequential OCR loop ────────────────────────────────────────────────
    for (let i = 0; i < files.length; i++) {
      setCurrentIndex(i);
      const file = files[i];

      try {
        // Phase 1: Upload to storage
        results[i] = { ...results[i], status: "uploading" };
        setBulkPages([...results]);

        const ext = file.name.split(".").pop();
        const storagePath = `${userId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("study-images")
          .upload(storagePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // Phase 2: OCR extraction
        results[i] = { ...results[i], status: "extracting", storagePath };
        setBulkPages([...results]);

        const formData = new FormData();
        formData.append("image", file);
        const ocrRes = await fetch("/api/study/ocr", {
          method: "POST",
          body: formData,
        });
        if (!ocrRes.ok) {
          const data = await ocrRes.json();
          throw new Error(data.error ?? "Text extraction failed.");
        }
        const { extractedText } = await ocrRes.json();
        if (!extractedText?.trim()) throw new Error("No text detected in image.");

        results[i] = { ...results[i], status: "done", extractedText, storagePath };
        setBulkPages([...results]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Processing failed";
        results[i] = { ...results[i], status: "error", error: msg };
        setBulkPages([...results]);
      }
    }

    setCurrentIndex(-1);

    // ── Combined summarization ─────────────────────────────────────────────
    const successful = results.filter(
      (p): p is BulkPageState & { extractedText: string; storagePath: string } =>
        p.status === "done" && !!p.extractedText && !!p.storagePath
    );

    if (successful.length === 0) {
      setError("All pages failed to process. Please check your images and try again.");
      return;
    }

    setIsSummarizing(true);
    try {
      const res = await fetch("/api/study/bulk-summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages: successful.map((p) => ({
            extractedText: p.extractedText,
            storagePath: p.storagePath,
          })),
          model: selectedModel,
          title: setTitle.trim() || undefined,
          customInstructions: customInstructions.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Summarization failed");
      }

      const { studyPageId } = await res.json();
      setIsDone(true);
      setIsSummarizing(false);
      setTimeout(() => router.push(`/study/${studyPageId}`), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Summarization failed";
      setError(msg);
      setIsSummarizing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setBulkPages([]);
    setCurrentIndex(-1);
    setIsSummarizing(false);
    setIsDone(false);
    setError(null);
  };

  // ── Render: processing view ────────────────────────────────────────────────

  if (hasStarted) {
    return (
      <div className="w-full space-y-4">
        <BulkPageProgressList
          pages={bulkPages}
          currentIndex={currentIndex}
          isSummarizing={isSummarizing}
          isDone={isDone}
        />
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {error && !isSummarizing && !isDone && (
          <Button onClick={handleReset} variant="outline" className="w-full" size="lg">
            Start Over
          </Button>
        )}
      </div>
    );
  }

  // ── Render: file selection view ────────────────────────────────────────────

  return (
    <div className="w-full space-y-4">
      {/* File count badge */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Files className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold text-white">
              {files.length} {files.length === 1 ? "page" : "pages"} selected
            </span>
            {files.length < MIN_FILES && (
              <span className="text-[11px] text-amber-400">
                (add at least {MIN_FILES - files.length} more)
              </span>
            )}
            {files.length === MAX_FILES && (
              <span className="text-[11px] text-white/30">(max reached)</span>
            )}
          </div>
          <button
            onClick={handleReset}
            className="text-[11px] text-white/30 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Dropzone — still shown to add more files */}
      {files.length < MAX_FILES && (
        <div
          {...getRootProps()}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors duration-300 group",
            isDragActive
              ? "border-violet-500 bg-violet-500/10"
              : files.length > 0
              ? "border-white/10 bg-white/[0.015] hover:border-violet-500/40 hover:bg-white/[0.03] py-6"
              : "border-white/15 bg-white/[0.03] hover:border-violet-500/50 hover:bg-white/5"
          )}
        >
          <input {...getInputProps()} />

          {files.length > 0 ? (
            <div className="flex items-center gap-2 text-white/40 group-hover:text-violet-400 transition-colors">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isDragActive ? "Drop to add pages" : "Add more pages"}
              </span>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 transition-all duration-300",
                  "group-hover:bg-violet-500/10 group-hover:border-violet-500/30"
                )}
              >
                <Upload
                  className={cn(
                    "h-7 w-7 transition-colors duration-300",
                    isDragActive
                      ? "text-violet-400"
                      : "text-white/40 group-hover:text-violet-400"
                  )}
                />
              </div>
              <p className="text-base font-semibold text-white mb-1">
                {isDragActive ? "Drop pages here!" : "Drop 2–10 book page images"}
              </p>
              <p className="text-sm text-white/40">
                or <span className="text-violet-400">browse</span> to select
              </p>
              <p className="mt-3 text-xs text-white/25">
                JPEG, PNG, WebP · Max {MAX_FILE_SIZE_MB}MB each · Up to {MAX_FILES} pages
              </p>
            </>
          )}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-[10px] font-bold text-violet-400">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white/75 truncate">{file.name}</p>
                <p className="text-[11px] text-white/30">{bytesToMb(file.size)} MB</p>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="h-6 w-6 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-red-500/10 hover:text-red-400 text-white/30 transition-colors flex-shrink-0"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      {files.length >= MIN_FILES && (
        <div className="space-y-3">
          {/* Chapter title */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
              Study Set Title
            </p>
            <input
              id="bulk-set-title"
              type="text"
              value={setTitle}
              onChange={(e) => setSetTitle(e.target.value)}
              placeholder={`Study Set — ${files.length} pages`}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/80 placeholder-white/25 outline-none transition-colors focus:border-violet-500/50 focus:bg-violet-500/[0.04]"
            />
          </div>

          {/* Custom Instructions */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
              Custom Instructions
            </p>
            <textarea
              id="bulk-custom-instructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ignore the filler content, just include raw facts"
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/80 placeholder-white/25 outline-none transition-colors focus:border-violet-500/50 focus:bg-violet-500/[0.04]"
            />
            <p className="mt-1.5 text-[10px] text-white/25">
              Optional — applied to the combined summary of all pages.
            </p>
          </div>

          {/* AI Model */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-medium text-white/40 mb-3 uppercase tracking-wider">
              AI Summarization Model
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MODEL_OPTIONS.map((m) => {
                const isSelected = selectedModel === m.value;
                const limitRaw =
                  m.value === "llama-8b"
                    ? limits.summaries8bPerDay
                    : m.value === "gpt-oss-20b"
                    ? limits.summaries20bPerDay
                    : limits.summaries120bPerDay;
                const limitLabel =
                  limitRaw === "unlimited" ? "Unlimited" : `${limitRaw}/day`;
                return (
                  <button
                    key={m.value}
                    onClick={() => setSelectedModel(m.value)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-all duration-200",
                      isSelected
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/10 bg-transparent hover:border-white/20"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        isSelected ? "text-white" : "text-white/50"
                      )}
                    >
                      {m.label}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">{m.desc}</p>
                    <p
                      className={cn(
                        "text-xs mt-1.5 font-medium",
                        isSelected ? "text-violet-400" : "text-white/25"
                      )}
                    >
                      {limitLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Process button */}
      {canProcess && (
        <Button
          onClick={handleProcess}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          size="lg"
        >
          Process {files.length} Pages & Generate Combined Summary
        </Button>
      )}
    </div>
  );
}
