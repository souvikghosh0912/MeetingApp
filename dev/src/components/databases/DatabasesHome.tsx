"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Database, Clock, Rows3, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserDatabase } from "@/types/database";
import { NewDatabaseModal } from "./NewDatabaseModal";

interface DatabasesHomeProps {
  initialDatabases: UserDatabase[];
}

export function DatabasesHome({ initialDatabases }: DatabasesHomeProps) {
  const [databases, setDatabases] = useState<UserDatabase[]>(initialDatabases);
  const [showNew, setShowNew] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreated = (db: UserDatabase) => {
    setDatabases((prev) => [{ ...db, record_count: 0 }, ...prev]);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/databases/${id}`, { method: "DELETE" });
      setDatabases((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">Databases</h1>
          <p className="text-[13px] text-white/40 mt-0.5">
            Flexible tables to organise any kind of data
          </p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          className="h-9 gap-2 bg-white text-black hover:bg-white/90 text-[13px] font-medium"
        >
          <Plus className="h-4 w-4" />
          New Database
        </Button>
      </div>

      {/* Empty state */}
      {databases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <Database className="h-6 w-6 text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-medium text-white/60">No databases yet</p>
            <p className="text-[13px] text-white/30 mt-1">
              Create your first database to start organising data
            </p>
          </div>
          <Button
            onClick={() => setShowNew(true)}
            variant="outline"
            className="border-white/[0.08] text-white/60 hover:text-white bg-transparent hover:bg-white/[0.04] h-9 text-[13px] gap-2"
          >
            <Plus className="h-4 w-4" />
            Create database
          </Button>
        </div>
      )}

      {/* Grid */}
      {databases.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {databases.map((db) => (
            <DatabaseCard
              key={db.id}
              db={db}
              onDelete={handleDelete}
              isDeleting={deleting === db.id}
            />
          ))}

          {/* New DB card */}
          <button
            onClick={() => setShowNew(true)}
            className="h-[130px] rounded-xl border border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/50 hover:border-white/[0.15] hover:bg-white/[0.02] transition-all"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[12px] font-medium">New database</span>
          </button>
        </div>
      )}

      <NewDatabaseModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

function DatabaseCard({
  db,
  onDelete,
  isDeleting,
}: {
  db: UserDatabase;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      className={cn(
        "group relative h-[130px] rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all overflow-hidden",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      {/* Colour accent strip */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-60"
        style={{ backgroundColor: db.color }}
      />

      <Link href={`/databases/${db.id}`} className="flex flex-col h-full p-4 gap-2">
        {/* Icon + name */}
        <div className="flex items-start gap-2.5">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: db.color + "18", border: `1px solid ${db.color}30` }}
          >
            {db.icon}
          </div>
          <div className="flex-1 min-w-0 mt-0.5">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">
              {db.name}
            </p>
            {db.description && (
              <p className="text-[11px] text-white/35 mt-0.5 truncate">{db.description}</p>
            )}
          </div>
        </div>

        {/* Footer stats */}
        <div className="mt-auto flex items-center gap-3 text-[11px] text-white/30">
          <span className="flex items-center gap-1">
            <Rows3 className="h-3 w-3" />
            {db.record_count ?? 0} rows
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(db.updated_at)}
          </span>
        </div>
      </Link>

      {/* Menu button */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen((o) => !o); }}
            className="h-6 w-6 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-7 right-0 z-20 min-w-[140px] rounded-lg border border-white/[0.08] bg-[#1a1a1a] shadow-xl py-1">
                <button
                  onClick={() => { setMenuOpen(false); onDelete(db.id); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:bg-white/[0.05] transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete database
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
