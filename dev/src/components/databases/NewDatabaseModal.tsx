"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UserDatabase } from "@/types/database";

const ICONS = ["🗂️", "📋", "📊", "🎯", "🚀", "💡", "🔧", "📝", "🗓️", "⚡", "🌟", "🔗"];
const COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#64748b", label: "Slate" },
];

interface NewDatabaseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (db: UserDatabase) => void;
}

export function NewDatabaseModal({ open, onClose, onCreated }: NewDatabaseModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🗂️");
  const [color, setColor] = useState("#6366f1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), icon, color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create database");
      onCreated(data.database);
      setName("");
      setIcon("🗂️");
      setColor("#6366f1");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111] border-white/[0.08] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold text-white">New Database</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-1">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: color + "22", border: `1px solid ${color}44` }}
            >
              {icon}
            </div>
            <span className="text-[14px] font-medium text-white truncate">
              {name.trim() || "Untitled Database"}
            </span>
          </div>

          {/* Name */}
          <div>
            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2 block">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Action Items, Projects, Contacts…"
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-white/20 h-9 text-[13px]"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2 block">
              Icon
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={cn(
                    "h-8 w-8 rounded-md text-lg flex items-center justify-center transition-all",
                    icon === i
                      ? "bg-white/[0.12] ring-1 ring-white/20"
                      : "bg-white/[0.04] hover:bg-white/[0.08]"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2 block">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-all",
                    color === c.value && "ring-2 ring-white/50 ring-offset-1 ring-offset-[#111]"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-[12px] text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-9 text-[13px] border-white/[0.08] text-white/60 hover:text-white bg-transparent hover:bg-white/[0.04]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="flex-1 h-9 text-[13px] bg-white text-black hover:bg-white/90 disabled:opacity-40"
            >
              {loading ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
