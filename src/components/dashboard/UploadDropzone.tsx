"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, FileAudio, FileVideo, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, ACCEPTED_AUDIO_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, bytesToMb, getFileType } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ModelType, Plan, TranscriptModelType, UploadState } from "@/types";
import { PLAN_LIMITS } from "@/lib/constants";
import { ProcessingStatus } from "./ProcessingStatus";

interface UploadDropzoneProps {
  userId: string;
  plan?: Plan;
  defaultModel?: ModelType;
}

export function UploadDropzone({ userId, plan = "free", defaultModel = "llama-8b" }: UploadDropzoneProps) {
  const limits = PLAN_LIMITS[plan];
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>(defaultModel);
  const [selectedTranscriptModel, setSelectedTranscriptModel] = useState<TranscriptModelType>("nova-3");
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "pending",
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    setError(null);
    if (rejectedFiles && (rejectedFiles as {errors: {code:string}[]}[]).length > 0) {
      const rej = rejectedFiles as {errors: {code: string, message: string}[]}[];
      const err = rej[0]?.errors[0];
      if (err?.code === "file-too-large") {
        setError(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      } else if (err?.code === "file-invalid-type") {
        setError("Invalid file type. Please upload MP3, MP4, WAV, FLAC, M4A, MOV, or WebM.");
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
    accept: ACCEPTED_AUDIO_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    maxFiles: 1,
    disabled: uploadState.status !== "pending",
  });

  const handleProcess = async () => {
    if (!selectedFile) return;
    setError(null);

    try {
      const supabase = createClient();
      const ext = selectedFile.name.split(".").pop();
      const storagePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Step 1: Upload to Supabase Storage
      setUploadState({ status: "uploading", progress: 10 });

      const { error: uploadError } = await supabase.storage
        .from("temp-uploads")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // Create a signed URL (5 min) so the server can download without service role
      const { data: signedData, error: signedError } = await supabase.storage
        .from("temp-uploads")
        .createSignedUrl(storagePath, 300);

      if (signedError || !signedData?.signedUrl) {
        throw new Error("Failed to create signed URL for transcription.");
      }

      setUploadState({ status: "transcribing", progress: 35 });

      // Step 2: Transcribe
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath,
          signedUrl: signedData.signedUrl,
          fileName: selectedFile.name,
          transcriptModel: selectedTranscriptModel,
        }),
      });

      if (!transcribeRes.ok) {
        const data = await transcribeRes.json();
        throw new Error(data.error ?? "Transcription failed");
      }

      const { transcript, segments } = await transcribeRes.json();
      
      if (!transcript || transcript.trim() === "") {
        throw new Error("No speech detected in the audio file.");
      }
      
      setUploadState({ status: "summarizing", progress: 65 });

      // Step 3: Summarize
      const fileType = getFileType(selectedFile);
      const summarizeRes = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transcript, 
          model: selectedModel,
          storagePath,
          segments,
          fileType 
        }),
      });

      if (!summarizeRes.ok) {
        const data = await summarizeRes.json();
        throw new Error(data.error ?? "Summarization failed");
      }

      const { summary, transcriptId } = await summarizeRes.json();
      setUploadState({ status: "done", progress: 100, transcriptId });

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/transcripts/${transcriptId}`);
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
    setUploadState({ status: "pending", progress: 0 });
  };

  const isProcessing = ["uploading", "transcribing", "summarizing"].includes(uploadState.status);

  if (isProcessing || uploadState.status === "done") {
    return <ProcessingStatus state={uploadState} fileName={selectedFile?.name ?? ""} />;
  }

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors duration-300",
          isDragActive
            ? "border-accent bg-accent/10"
            : "border-white/15 bg-white/3 hover:border-accent/50 hover:bg-white/5",
          "group"
        )}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30">
                {getFileType(selectedFile) === "video" ? (
                  <FileVideo className="h-8 w-8 text-accent" />
                ) : (
                  <FileAudio className="h-8 w-8 text-accent" />
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
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
              "group-hover:bg-accent/10 group-hover:border-accent/30"
            )}>
              <Upload className={cn(
                "h-7 w-7 transition-colors duration-300",
                isDragActive ? "text-accent" : "text-text-secondary group-hover:text-accent"
              )} />
            </div>
            <p className="text-base font-semibold text-white mb-1">
              {isDragActive ? "Drop it here!" : "Drop your meeting file"}
            </p>
            <p className="text-sm text-text-secondary">
              or <span className="text-accent">browse</span> to upload
            </p>
            <p className="mt-3 text-xs text-text-muted">
              MP3, MP4, WAV, FLAC, M4A, MOV · Max {MAX_FILE_SIZE_MB}MB
            </p>
          </>
        )}
      </div>

      {/* Model selectors */}
      {selectedFile && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wider">Transcription Model</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "whisper-v3", label: "Whisper v3", desc: "Groq · Lightning fast" },
                { value: "nova-3", label: "Deepgram Nova 3", desc: "Fast · Speaker Diarization" },
              ] as const).map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSelectedTranscriptModel(m.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-all duration-200",
                    selectedTranscriptModel === m.value
                      ? "border-accent/50 bg-accent/10"
                      : "border-white/10 bg-transparent hover:border-white/20"
                  )}
                >
                  <p className={cn("text-xs font-semibold", selectedTranscriptModel === m.value ? "text-white" : "text-text-secondary")}>
                    {m.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wider">AI Model</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                {
                  value: "llama-8b" as const,
                  label: "LLaMA 3.1 8B",
                  desc: "Fast · Standard detail",
                  limit: limits.summaries8bPerDay,
                },
                {
                  value: "gpt-oss-20b" as const,
                  label: "GPT-OSS 20B",
                  desc: "Balanced · Better context",
                  limit: limits.summaries20bPerDay,
                },
                {
                  value: "gpt-oss-120b" as const,
                  label: "GPT-OSS 120B",
                  desc: "Powerful · Richer output",
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
                        ? "border-accent/50 bg-accent/10"
                        : "border-white/10 bg-transparent hover:border-white/20"
                    )}
                  >
                    <p className={cn("text-xs font-semibold", isSelected ? "text-white" : "text-text-secondary")}>
                      {m.label}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{m.desc}</p>
                    <p className={cn(
                      "text-xs mt-1.5 font-medium",
                      isSelected ? "text-accent/80" : "text-text-muted"
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
        <Button onClick={handleProcess} className="w-full" size="lg">
          Process Meeting
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
