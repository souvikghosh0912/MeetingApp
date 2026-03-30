"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcriptId: string;
  currentTitle: string;
  onRenamed?: (newTitle: string) => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  transcriptId,
  currentTitle,
  onRenamed,
}: RenameDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState(currentTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRename = async () => {
    const trimmed = title.trim();
    if (!trimmed) { setError("Title cannot be empty."); return; }
    if (trimmed === currentTitle) { onOpenChange(false); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/transcripts/${transcriptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to rename.");
        return;
      }

      onRenamed?.(trimmed);
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename transcript</DialogTitle>
          <DialogDescription>Give this meeting a more descriptive name.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
            placeholder="Meeting title..."
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
