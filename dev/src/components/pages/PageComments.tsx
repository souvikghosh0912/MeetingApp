"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, CheckCircle2, Circle, Trash2, MessageSquare } from "lucide-react";
import { PageComment } from "@/types";
import { format } from "date-fns";
import { ReportButton } from "@/components/moderation/ReportButton";

interface PageCommentsProps {
  pageId: string;
  onClose: () => void;
}

export function PageComments({ pageId, onClose }: PageCommentsProps) {
  const [comments, setComments] = useState<PageComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?page_id=${pageId}`);
    const data = await res.json();
    setComments(data.comments ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleSubmit = async () => {
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id: pageId, content: draft.trim() }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments((prev) => [...prev, data.comment]);
      setDraft("");
    }
    setSubmitting(false);
  };

  const toggleResolved = async (comment: PageComment) => {
    const res = await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: !comment.resolved }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, resolved: data.comment.resolved } : c))
      );
    }
  };

  const deleteComment = async (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
  };

  const visible = comments.filter((c) => showResolved || !c.resolved);
  const resolvedCount = comments.filter((c) => c.resolved).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-white/50" />
          <span className="text-[14px] font-semibold text-white">Comments</span>
          {comments.length > 0 && (
            <span className="text-[11px] text-white/30 bg-white/[0.06] rounded-full px-1.5 py-0.5">
              {comments.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.07] transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Resolved toggle */}
      {resolvedCount > 0 && (
        <div className="px-4 py-2 border-b border-white/[0.07]">
          <button
            onClick={() => setShowResolved((s) => !s)}
            className="text-[11px] text-white/35 hover:text-white/60 transition-colors"
          >
            {showResolved ? "Hide" : "Show"} {resolvedCount} resolved
          </button>
        </div>
      )}

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <MessageSquare className="h-8 w-8 text-white/10" />
            <p className="text-[13px] text-white/30">No comments yet</p>
            <p className="text-[11px] text-white/20">Be the first to leave a comment</p>
          </div>
        )}

        {visible.map((c) => (
          <div
            key={c.id}
            className={`group rounded-xl p-3 border transition-colors ${
              c.resolved
                ? "border-white/[0.04] bg-white/[0.01] opacity-50"
                : "border-white/[0.07] bg-white/[0.02]"
            }`}
          >
            {/* Author + time */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300 flex-shrink-0">
                  {(c.author_name ?? "U").charAt(0).toUpperCase()}
                </div>
                <span className="text-[12px] font-medium text-white/70">
                  {c.author_name ?? "User"}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleResolved(c)}
                  className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white transition-colors"
                  title={c.resolved ? "Reopen" : "Resolve"}
                >
                  {c.resolved
                    ? <Circle className="h-3.5 w-3.5" />
                    : <CheckCircle2 className="h-3.5 w-3.5" />
                  }
                </button>
                <ReportButton
                  itemId={c.id}
                  reportType="comment"
                  className="h-6 w-6 p-0 text-white/30 hover:text-white"
                  showLabel={false}
                />
                <button
                  onClick={() => deleteComment(c.id)}
                  className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Content */}
            <p className="text-[13px] text-white/70 leading-relaxed break-words">{c.content}</p>

            {/* Timestamp */}
            <p className="text-[10px] text-white/20 mt-1.5">
              {format(new Date(c.created_at), "MMM d, h:mm a")}
              {c.resolved && " · Resolved"}
            </p>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="px-4 py-3 border-t border-white/[0.07]">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            placeholder="Add a comment… (⌘↵ to send)"
            rows={2}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!draft.trim() || submitting}
            className="h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white disabled:opacity-40 transition-all flex-shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
