"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import { TranscriptSegment, SpeakerNames } from "@/types";
import { cn } from "@/lib/utils";
import {
  PlayCircle,
  Volume2,
  Users,
  Pencil,
  Check,
  X,
  Save,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Speaker color palette ────────────────────────────────────────────────────
const SPEAKER_PALETTE = [
  {
    activeBg: "bg-blue-500/15",
    activeRing: "border-blue-500/40",
    label: "text-blue-400",
    avatar: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    dot: "bg-blue-400",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.12)]",
    editBorder: "border-blue-500/40 focus:border-blue-400",
  },
  {
    activeBg: "bg-violet-500/15",
    activeRing: "border-violet-500/40",
    label: "text-violet-400",
    avatar: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    dot: "bg-violet-400",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.12)]",
    editBorder: "border-violet-500/40 focus:border-violet-400",
  },
  {
    activeBg: "bg-emerald-500/15",
    activeRing: "border-emerald-500/40",
    label: "text-emerald-400",
    avatar: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.12)]",
    editBorder: "border-emerald-500/40 focus:border-emerald-400",
  },
  {
    activeBg: "bg-amber-500/15",
    activeRing: "border-amber-500/40",
    label: "text-amber-400",
    avatar: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    dot: "bg-amber-400",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.12)]",
    editBorder: "border-amber-500/40 focus:border-amber-400",
  },
  {
    activeBg: "bg-rose-500/15",
    activeRing: "border-rose-500/40",
    label: "text-rose-400",
    avatar: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    dot: "bg-rose-400",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.12)]",
    editBorder: "border-rose-500/40 focus:border-rose-400",
  },
  {
    activeBg: "bg-cyan-500/15",
    activeRing: "border-cyan-500/40",
    label: "text-cyan-400",
    avatar: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    dot: "bg-cyan-400",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.12)]",
    editBorder: "border-cyan-500/40 focus:border-cyan-400",
  },
  {
    activeBg: "bg-fuchsia-500/15",
    activeRing: "border-fuchsia-500/40",
    label: "text-fuchsia-400",
    avatar: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
    dot: "bg-fuchsia-400",
    glow: "shadow-[0_0_20px_rgba(217,70,239,0.12)]",
    editBorder: "border-fuchsia-500/40 focus:border-fuchsia-400",
  },
  {
    activeBg: "bg-orange-500/15",
    activeRing: "border-orange-500/40",
    label: "text-orange-400",
    avatar: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    dot: "bg-orange-400",
    glow: "shadow-[0_0_20px_rgba(249,115,22,0.12)]",
    editBorder: "border-orange-500/40 focus:border-orange-400",
  },
];

function getSpeakerPalette(index: number) {
  return SPEAKER_PALETTE[index % SPEAKER_PALETTE.length];
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface InteractiveTranscriptViewerProps {
  transcriptId?: string;
  mediaUrl?: string;
  fileType?: "audio" | "video" | string;
  segments?: TranscriptSegment[];
  fallbackText?: string | null;
  initialSpeakerNames?: SpeakerNames;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function InteractiveTranscriptViewer({
  transcriptId,
  mediaUrl,
  fileType,
  segments: initialSegments,
  fallbackText,
  initialSpeakerNames = {},
}: InteractiveTranscriptViewerProps) {
  // ── Playback state ───────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  const mediaRef = useRef<HTMLMediaElement>(null);

  // ── Edit mode ────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editedSegments, setEditedSegments] = useState<TranscriptSegment[]>(
    () => initialSegments ?? []
  );
  const [isSavingTranscript, startSaveTranscript] = useTransition();
  const [saveTranscriptError, setSaveTranscriptError] = useState<string | null>(null);
  const [saveTranscriptSuccess, setSaveTranscriptSuccess] = useState(false);

  // ── Speaker naming ───────────────────────────────────────────────────────
  const [speakerNames, setSpeakerNames] = useState<SpeakerNames>(initialSpeakerNames);
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [speakerDraft, setSpeakerDraft] = useState("");
  const [isSavingSpeakers, startSaveSpeakers] = useTransition();
  const speakerInputRef = useRef<HTMLInputElement>(null);

  // Sync segments if prop changes (e.g. after navigation)
  useEffect(() => {
    setEditedSegments(initialSegments ?? []);
  }, [initialSegments]);

  useEffect(() => {
    setSpeakerNames(initialSpeakerNames);
  }, [initialSpeakerNames]);

  // ── Media time tracking ──────────────────────────────────────────────────
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    const handleTimeUpdate = () => setCurrentTime(media.currentTime);
    media.addEventListener("timeupdate", handleTimeUpdate);
    return () => media.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  // ── Speaker index (first-appearance order) ───────────────────────────────
  const speakerIndex = useMemo(() => {
    const map = new Map<string, number>();
    if (!initialSegments) return map;
    for (const seg of initialSegments) {
      if (seg.speaker && !map.has(seg.speaker)) {
        map.set(seg.speaker, map.size);
      }
    }
    return map;
  }, [initialSegments]);

  const hasDiarization = speakerIndex.size > 1;

  // Display name resolver
  const getDisplayName = useCallback(
    (rawSpeaker: string) => speakerNames[rawSpeaker] ?? rawSpeaker,
    [speakerNames]
  );

  // ── Dirty state ──────────────────────────────────────────────────────────
  const isTranscriptDirty = useMemo(() => {
    if (!initialSegments || editedSegments.length !== initialSegments.length) return false;
    return editedSegments.some((s, i) => s.text !== initialSegments[i].text);
  }, [editedSegments, initialSegments]);

  // ── Speaker filter ───────────────────────────────────────────────────────
  const handleSpeakerFilter = (speaker: string) => {
    if (editMode) return; // don't filter while editing
    setActiveSpeakers((prev) => {
      const next = new Set(prev);
      if (next.has(speaker)) next.delete(speaker);
      else next.add(speaker);
      return next;
    });
  };

  // ── Seek ─────────────────────────────────────────────────────────────────
  const handleSeek = (time: number) => {
    if (editMode) return;
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      mediaRef.current.play().catch(() => {});
    }
  };

  // ── Segment text edit ─────────────────────────────────────────────────────
  const handleSegmentChange = (idx: number, value: string) => {
    setEditedSegments((prev) =>
      prev.map((seg, i) => (i === idx ? { ...seg, text: value } : seg))
    );
  };

  // ── Save transcript edits ─────────────────────────────────────────────────
  const handleSaveTranscript = () => {
    if (!transcriptId) return;
    setSaveTranscriptError(null);
    setSaveTranscriptSuccess(false);

    startSaveTranscript(async () => {
      try {
        const reconstructed = editedSegments.map((s) => s.text).join(" ");
        const res = await fetch(`/api/transcripts/${transcriptId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segments: editedSegments,
            transcript_text: reconstructed,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setSaveTranscriptError(data.error ?? "Save failed");
        } else {
          setSaveTranscriptSuccess(true);
          setEditMode(false);
          setTimeout(() => setSaveTranscriptSuccess(false), 3000);
        }
      } catch {
        setSaveTranscriptError("Network error");
      }
    });
  };

  // ── Discard edits ─────────────────────────────────────────────────────────
  const handleDiscardEdits = () => {
    setEditedSegments(initialSegments ?? []);
    setEditMode(false);
    setSaveTranscriptError(null);
  };

  // ── Speaker rename ────────────────────────────────────────────────────────
  const startEditingSpeaker = (rawSpeaker: string) => {
    setEditingSpeaker(rawSpeaker);
    setSpeakerDraft(speakerNames[rawSpeaker] ?? rawSpeaker);
    setTimeout(() => speakerInputRef.current?.select(), 50);
  };

  const commitSpeakerRename = () => {
    if (!editingSpeaker || !transcriptId) {
      setEditingSpeaker(null);
      return;
    }

    const trimmed = speakerDraft.trim();
    const newNames = {
      ...speakerNames,
      [editingSpeaker]: trimmed || editingSpeaker,
    };
    setSpeakerNames(newNames);
    setEditingSpeaker(null);

    startSaveSpeakers(async () => {
      await fetch(`/api/transcripts/${transcriptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speaker_names: newNames }),
      });
    });
  };

  const cancelSpeakerRename = () => {
    setEditingSpeaker(null);
    setSpeakerDraft("");
  };

  // ── Visible segments (filtered) ───────────────────────────────────────────
  const sourceSegments = useMemo(
    () => (editMode ? editedSegments : (initialSegments ?? [])),
    [editMode, editedSegments, initialSegments]
  );
  const visibleSegments = useMemo(() => {
    if (activeSpeakers.size === 0) return sourceSegments;
    return sourceSegments.filter((s) => s.speaker && activeSpeakers.has(s.speaker));
  }, [sourceSegments, activeSpeakers]);

  const isVideo = fileType === "video";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* ── Media Player ────────────────────────────────────────────────────── */}
      {mediaUrl && (
        <div
          className={cn(
            "w-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-black/40 backdrop-blur-md",
            !isVideo && "p-4"
          )}
        >
          {isVideo ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={mediaUrl}
              controls
              className="w-full h-auto max-h-[500px] object-contain bg-black"
              controlsList="nodownload"
            />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-2">
                <Volume2 className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-white">Audio Playback</span>
              </div>
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={mediaUrl}
                controls
                className="w-full h-12 custom-audio-player"
                controlsList="nodownload"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Speaker Legend ───────────────────────────────────────────────────── */}
      {hasDiarization && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-text-secondary" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {speakerIndex.size} Speakers Detected
            </span>
            <span className="ml-auto text-xs text-text-muted">
              {editMode ? "Click pencil to rename" : "Click to filter"}
            </span>
            {isSavingSpeakers && (
              <Loader2 className="h-3 w-3 animate-spin text-text-muted" />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from(speakerIndex.entries()).map(([rawSpeaker, idx]) => {
              const palette = getSpeakerPalette(idx);
              const isFiltered = activeSpeakers.has(rawSpeaker);
              const isBeingEdited = editingSpeaker === rawSpeaker;
              const count = initialSegments?.filter((s) => s.speaker === rawSpeaker).length ?? 0;
              const displayName = getDisplayName(rawSpeaker);

              return (
                <div key={rawSpeaker} className="flex items-center">
                  {isBeingEdited ? (
                    /* ── Inline rename input ── */
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs",
                        palette.activeBg,
                        palette.activeRing
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full shrink-0", palette.dot)} />
                      <input
                        ref={speakerInputRef}
                        value={speakerDraft}
                        onChange={(e) => setSpeakerDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitSpeakerRename();
                          if (e.key === "Escape") cancelSpeakerRename();
                        }}
                        className={cn(
                          "w-28 bg-transparent outline-none font-medium",
                          palette.label
                        )}
                        autoFocus
                        maxLength={30}
                      />
                      <button
                        onClick={commitSpeakerRename}
                        className={cn("hover:opacity-100 opacity-70 transition-opacity", palette.label)}
                        title="Save name"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={cancelSpeakerRename}
                        className="opacity-50 hover:opacity-80 text-text-secondary transition-opacity"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* ── Normal speaker pill ── */
                    <button
                      onClick={() => handleSpeakerFilter(rawSpeaker)}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                        !editMode && isFiltered
                          ? `${palette.activeBg} ${palette.activeRing} ${palette.label}`
                          : "border-white/10 bg-white/5 text-text-secondary hover:border-white/20 hover:text-white"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full shrink-0", palette.dot)} />
                      <span>{displayName}</span>
                      {displayName !== rawSpeaker && (
                        <span className="text-text-muted font-normal opacity-60">({rawSpeaker})</span>
                      )}
                      <span className="text-text-muted font-normal">{count} seg</span>
                      {/* Rename pencil — always visible, opens inline editor */}
                      {transcriptId && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingSpeaker(rawSpeaker);
                          }}
                          className="ml-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                          title={`Rename ${displayName}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  )}
                </div>
              );
            })}

            {activeSpeakers.size > 0 && !editMode && (
              <button
                onClick={() => setActiveSpeakers(new Set())}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-text-muted hover:text-white transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Transcript Header ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Interactive Transcript
          </h2>

          {/* Edit / Save / Discard controls */}
          {transcriptId && initialSegments && initialSegments.length > 0 && (
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDiscardEdits}
                    className="h-7 px-2.5 text-xs text-text-muted hover:text-white gap-1.5"
                    disabled={isSavingTranscript}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveTranscript}
                    disabled={!isTranscriptDirty || isSavingTranscript}
                    className="h-7 px-3 text-xs bg-accent hover:bg-accent/80 text-white gap-1.5"
                  >
                    {isSavingTranscript ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save edits
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditMode(true);
                    setSaveTranscriptError(null);
                  }}
                  className="h-7 px-2.5 text-xs border-white/20 hover:bg-white/10 bg-black/20 text-white gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5 text-accent" />
                  Edit transcript
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Error / success banners */}
        {saveTranscriptError && (
          <p className="mb-2 text-xs text-red-400 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
            {saveTranscriptError}
          </p>
        )}
        {saveTranscriptSuccess && (
          <p className="mb-2 text-xs text-emerald-400 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            Transcript saved successfully.
          </p>
        )}
        {editMode && (
          <p className="mb-2 text-xs text-amber-400/80 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2">
            Edit mode — click any segment to correct the text. Timestamps are preserved.
          </p>
        )}

        {/* ── Transcript Body ──────────────────────────────────────────────── */}
        <div className="flex-1 rounded-xl border border-white/10 bg-white/3 p-4 md:p-6 overflow-y-auto max-h-[600px] shadow-inner custom-scrollbar relative">
          {!sourceSegments || sourceSegments.length === 0 ? (
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap font-mono">
              {fallbackText || (
                <span className="italic text-text-muted">No transcript available.</span>
              )}
            </p>
          ) : visibleSegments.length === 0 ? (
            <span className="italic text-sm text-text-muted">
              No segments for the selected speaker(s).
            </span>
          ) : (
            <div className="space-y-0.5">
              {visibleSegments.map((seg, idx) => {
                const isActive = !editMode && currentTime >= seg.start && currentTime < seg.end;
                const isPast = !editMode && currentTime > seg.end;
                const speakerIdx = seg.speaker ? (speakerIndex.get(seg.speaker) ?? 0) : 0;
                const palette = getSpeakerPalette(speakerIdx);

                // Original index in editedSegments (needed for onChange)
                const originalIdx = editMode
                  ? editedSegments.findIndex(
                      (s) => s.start === seg.start && s.end === seg.end
                    )
                  : idx;

                // Show speaker header on speaker change
                const prevSeg = idx > 0 ? visibleSegments[idx - 1] : null;
                const showSpeakerHeader =
                  hasDiarization && seg.speaker && seg.speaker !== prevSeg?.speaker;

                return (
                  <div key={`${seg.start}-${idx}`}>
                    {/* Speaker change header */}
                    {showSpeakerHeader && (
                      <div
                        className={cn(
                          "flex items-center gap-2 pb-1 pl-1",
                          idx === 0 ? "pt-0" : "pt-5"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold shrink-0",
                            palette.avatar
                          )}
                        >
                          {seg.speaker?.replace("Speaker ", "")}
                        </div>
                        <span className={cn("text-xs font-semibold tracking-wide", palette.label)}>
                          {getDisplayName(seg.speaker!)}
                        </span>
                      </div>
                    )}

                    {/* Segment row */}
                    <div
                      onClick={() => !editMode && handleSeek(seg.start)}
                      className={cn(
                        "group relative flex gap-3 sm:gap-4 p-3 rounded-xl transition-all duration-300",
                        hasDiarization && "ml-9",
                        editMode
                          ? "cursor-text"
                          : "cursor-pointer",
                        !editMode && isActive
                          ? `${palette.activeBg} border ${palette.activeRing} ${palette.glow}`
                          : !editMode
                          ? "hover:bg-white/5 border border-transparent"
                          : "border border-transparent"
                      )}
                    >
                      {/* Timestamp */}
                      <div className="flex flex-col items-start gap-1 w-14 shrink-0 select-none pt-0.5">
                        <span
                          className={cn(
                            "text-xs font-mono tabular-nums transition-colors duration-300",
                            isActive
                              ? palette.label
                              : "text-text-muted group-hover:text-text-secondary"
                          )}
                        >
                          {formatTime(seg.start)}
                        </span>
                        {!editMode && (
                          <PlayCircle
                            className={cn(
                              "h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity",
                              isActive ? `${palette.label} opacity-100` : "text-text-muted"
                            )}
                          />
                        )}
                      </div>

                      {/* Transcript text — view or edit */}
                      {editMode ? (
                        <textarea
                          value={seg.text}
                          onChange={(e) => {
                            if (originalIdx >= 0) {
                              handleSegmentChange(originalIdx, e.target.value);
                            }
                          }}
                          rows={Math.max(1, Math.ceil(seg.text.length / 80))}
                          className={cn(
                            "flex-1 resize-none rounded-lg border bg-white/5 px-3 py-2 text-sm leading-relaxed text-white outline-none transition-colors duration-150",
                            palette.editBorder,
                            "focus:bg-white/8"
                          )}
                        />
                      ) : (
                        <span
                          className={cn(
                            "text-sm sm:text-base leading-relaxed transition-colors duration-300",
                            isActive
                              ? "text-white font-medium"
                              : isPast
                              ? "text-text-secondary"
                              : "text-white/85"
                          )}
                        >
                          {seg.text}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
