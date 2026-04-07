"use client";

import { useState } from "react";
import Link from "next/link";
import { FileAudio, FileVideo, MoreVertical, Trash2, Pencil, Calendar, Clock } from "lucide-react";
import { Transcript } from "@/types";
import { formatRelativeTime, formatDuration, getFileType } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MODEL_NAMES } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenameDialog } from "./RenameDialog";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface TranscriptCardProps {
  transcript: Transcript;
  onDeleted?: (id: string) => void;
  onRenamed?: (id: string, title: string) => void;
}

export function TranscriptCard({ transcript, onDeleted, onRenamed }: TranscriptCardProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isVideo = transcript.file_type === "video";

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${transcript.title}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/transcripts/${transcript.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.(transcript.id);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Link
        href={`/transcripts/${transcript.id}`}
        className="group relative flex flex-col h-full rounded-xl border border-white/10 bg-white/3 p-5 hover:border-white/20 hover:bg-white/5 transition-colors duration-200 hover:shadow-glow-sm"
      >
        {/* File icon + title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
            {isVideo ? (
              <FileVideo className="h-5 w-5 text-accent" />
            ) : (
              <FileAudio className="h-5 w-5 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate pr-8 group-hover:text-accent transition-colors">
              {transcript.title}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Calendar className="h-3 w-3" />
                {formatRelativeTime(transcript.created_at)}
              </span>
              {transcript.duration_seconds && (
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="h-3 w-3" />
                  {formatDuration(transcript.duration_seconds)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary preview */}
        {transcript.summary?.tldr?.[0] && (
          <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
            {transcript.summary.tldr[0]}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <Badge variant="secondary" className="text-xs">
            {MODEL_NAMES[transcript.model_used]}
          </Badge>
          {transcript.summary?.action_items && (
            <span className="text-xs text-text-muted">
              {transcript.summary.action_items.length} action items
            </span>
          )}
        </div>

        {/* Actions menu */}
        <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 w-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-text-secondary hover:text-white">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Link>

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        transcriptId={transcript.id}
        currentTitle={transcript.title}
        onRenamed={(title) => onRenamed?.(transcript.id, title)}
      />
    </>
  );
}
