"use client";

import { useEffect, useState } from "react";
import type { Metadata } from "next";
import { FileText, Search, Loader2 } from "lucide-react";
import { TranscriptCard } from "@/components/transcripts/TranscriptCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Transcript } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/transcripts")
      .then((r) => r.json())
      .then((data) => {
        setTranscripts(data.transcripts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = transcripts.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleted = (id: string) =>
    setTranscripts((prev) => prev.filter((t) => t.id !== id));

  const handleRenamed = (id: string, title: string) =>
    setTranscripts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t))
    );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transcripts</h1>
          <p className="text-sm text-text-secondary mt-1">
            {transcripts.length} saved meeting{transcripts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-3.5 w-3.5" />
            New Upload
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          placeholder="Search transcripts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-text-muted" />
          </div>
          <p className="text-base font-medium text-white mb-1">
            {search ? "No transcripts found" : "No transcripts yet"}
          </p>
          <p className="text-sm text-text-secondary mb-6">
            {search
              ? "Try a different search term"
              : "Upload a meeting recording to get started"}
          </p>
          {!search && (
            <Link href="/dashboard">
              <Button size="sm">Upload a meeting</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <TranscriptCard
              key={t.id}
              transcript={t}
              onDeleted={handleDeleted}
              onRenamed={handleRenamed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
