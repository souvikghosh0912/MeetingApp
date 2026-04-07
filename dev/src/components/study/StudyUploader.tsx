"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, FileImage, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, bytesToMb } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ModelType, Plan, StudyStatus } from "@/types";
import { PLAN_LIMITS } from "@/lib/constants";
import { ProcessingStatus } from "@/components/dashboard/ProcessingStatus";

interface StudyUploaderProps {
  userId: string;
  plan?: Plan;
  defaultModel?: ModelType;
}

export function StudyUploader({ userId, plan = "free", defaultModel = "gpt-oss-20b" }: StudyUploaderProps) {
  const limits = PLAN_LIMITS[plan];
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>(defaultModel);
  const [uploadState, setUploadState] = useState<{status: StudyStatus, progress: number, studyPageId?: string}>({
    status: "idle",
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
  const MAX_FILE_SIZE_MB = 10;

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    setError(null);
    if (rejectedFiles && (rejectedFiles as {errors: {code:string}[]}[]).length > 0) {
      const rej = rejectedFiles as {errors: {code: string, message: string}[]}[];
      const err = rej[0]?.errors[0];
      if (err?.code === "file-too-large") {
        setError(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      } else if (err?.code === "file-invalid-type") {
        setError("Invalid file type. Please upload JPEG, PNG, WebP, or GIF.");
      } else {
        setError(err?.message ?? "Invalid file.");
      }
      return;
    }
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: MAX_FILE_SIZE_BYTES,
    maxFiles: 1,
    disabled: uploadState.status !== "idle" && uploadState.status !== "error",
  });

  const handleProcess = async () => {
    if (!selectedFile) return;
    setError(null);

    try {
      const supabase = createClient();
      const ext = selectedFile.name.split(".").pop();
      const storagePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Phase 1: Uploading & Extraction
      setUploadState({ status: "uploading", progress: 20 });
      
      const { error: uploadError } = await supabase.storage
        .from("study-images")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // We still pass the file to OCR directly as it needs the buffer/base64 to send to NIM
      const formData = new FormData();
      formData.append("image", selectedFile);

      setUploadState({ status: "extracting", progress: 40 });

      const ocrRes = await fetch("/api/study/ocr", {
        method: "POST",
        body: formData,
      });
      
      if (!ocrRes.ok) {
        const data = await ocrRes.json();
        throw new Error(data.error ?? "Text extraction failed.");
      }

      const { extractedText } = await ocrRes.json();

      if (!extractedText || extractedText.trim() === "") {
        throw new Error("No text detected in the image.");
      }

      // Phase 2: Summarizing
      setUploadState({ status: "summarizing", progress: 70 });
      
      const summarizeRes = await fetch("/api/study/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          extractedText, 
          model: selectedModel,
          sourceImagePath: storagePath,
        }),
      });

      if (!summarizeRes.ok) {
        const data = await summarizeRes.json();
        throw new Error(data.error ?? "Summarization failed");
      }

      const { studyPageId } = await summarizeRes.json();
      
      // Phase 3: Done
      setUploadState({ status: "done", progress: 100, studyPageId });

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/study/${studyPageId}`);
      }, 1200);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setUploadState({ status: "error", progress: 0 });
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setError(null);
    setUploadState({ status: "idle", progress: 0 });
  };

  const isProcessing = ["uploading", "extracting", "summarizing"].includes(uploadState.status);

  if (isProcessing || uploadState.status === "done") {
    return <ProcessingStatus state={uploadState} fileName={selectedFile?.name ?? ""} type="study" />;
  }

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors duration-300",
          isDragActive
            ? "border-violet-500 bg-violet-500/10"
            : "border-white/15 bg-white/3 hover:border-violet-500/50 hover:bg-white/5",
          "group"
        )}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/30">
                <FileImage className="h-8 w-8 text-violet-400" />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                title="Remove file"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
              <p className="text-xs text-text-secondary mt-0.5">{bytesToMb(selectedFile.size)} MB</p>
            </div>
          </div>
        ) : (
          <>
            <div className={cn(
              "mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 transition-all duration-300",
              "group-hover:bg-violet-500/10 group-hover:border-violet-500/30"
            )}>
              <Upload className={cn(
                "h-7 w-7 transition-colors duration-300",
                isDragActive ? "text-violet-400" : "text-text-secondary group-hover:text-violet-400"
              )} />
            </div>
            <p className="text-base font-semibold text-white mb-1">
              {isDragActive ? "Drop it here!" : "Drop your book page image"}
            </p>
            <p className="text-sm text-text-secondary">
              or <span className="text-violet-400">browse</span> to upload
            </p>
            <p className="mt-3 text-xs text-text-muted">
              JPEG, PNG, WebP · Max {MAX_FILE_SIZE_MB}MB
            </p>
          </>
        )}
      </div>

      {/* Model selectors */}
      {selectedFile && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wider">AI Summarization Model</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                {
                  value: "llama-8b" as const,
                  label: "LLaMA 3.1 8B",
                  desc: "Fast · Simple concepts",
                  limit: limits.summaries8bPerDay,
                },
                {
                  value: "gpt-oss-20b" as const,
                  label: "GPT-OSS 20B",
                  desc: "Balanced · Recommended",
                  limit: limits.summaries20bPerDay,
                },
                {
                  value: "gpt-oss-120b" as const,
                  label: "GPT-OSS 120B",
                  desc: "Powerful · Complex topics",
                  limit: limits.summaries120bPerDay,
                },
              ]).map((m) => {
                const isSelected = selectedModel === m.value;
                const limitLabel =
                  m.limit === "unlimited" ? "Unlimited" : `${m.limit}/day`;
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
                    <p className={cn("text-xs font-semibold", isSelected ? "text-white" : "text-text-secondary")}>
                      {m.label}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{m.desc}</p>
                    <p className={cn(
                      "text-xs mt-1.5 font-medium",
                      isSelected ? "text-violet-400" : "text-text-muted"
                    )}>
                      {limitLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Process button */}
      {selectedFile && uploadState.status !== "error" && (
        <Button onClick={handleProcess} className="w-full bg-violet-600 hover:bg-violet-700 text-white" size="lg">
          Process Study Page
        </Button>
      )}
      {uploadState.status === "error" && (
        <Button onClick={handleReset} variant="outline" className="w-full" size="lg">
          Try Again
        </Button>
      )}
    </div>
  );
}
