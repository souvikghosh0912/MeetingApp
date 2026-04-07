"use client";

import { useState, useEffect, useCallback } from "react";

export interface Annotation {
  id: string;
  selectedText: string;
  note: string;
  createdAt: string;
}

const STORAGE_KEY = (id: string) => `study-annotations-${id}`;

export function useAnnotations(studyPageId: string) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(studyPageId));
      if (raw) setAnnotations(JSON.parse(raw));
    } catch {
      // localStorage unavailable - silently ignore
    }
  }, [studyPageId]);

  const persist = useCallback(
    (next: Annotation[]) => {
      setAnnotations(next);
      try {
        localStorage.setItem(STORAGE_KEY(studyPageId), JSON.stringify(next));
      } catch {
        // storage quota or unavailability - silently ignore
      }
    },
    [studyPageId]
  );

  const addAnnotation = useCallback(
    (selectedText: string, note: string) => {
      const next: Annotation = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        selectedText,
        note,
        createdAt: new Date().toISOString(),
      };
      setAnnotations((prev) => {
        const updated = [...prev, next];
        try {
          localStorage.setItem(STORAGE_KEY(studyPageId), JSON.stringify(updated));
        } catch { /* ignore */ }
        return updated;
      });
      return next;
    },
    [studyPageId]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      setAnnotations((prev) => {
        const next = prev.filter((a) => a.id !== id);
        try {
          localStorage.setItem(STORAGE_KEY(studyPageId), JSON.stringify(next));
        } catch { /* ignore */ }
        return next;
      });
    },
    [studyPageId]
  );

  return { annotations, addAnnotation, deleteAnnotation };
}
