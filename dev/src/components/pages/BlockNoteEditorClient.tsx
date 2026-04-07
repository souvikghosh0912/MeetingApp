"use client";

/**
 * BlockNoteEditorClient — client-only wrapper for BlockNote.
 *
 * This file is intentionally isolated from PageEditor.tsx and loaded only
 * via `next/dynamic({ ssr: false })`.  Keeping all @blocknote/* imports here
 * ensures webpack never tries to resolve their CJS bundles during SSR, which
 * would fail because @handlewithcare/prosemirror-inputrules has no CJS export.
 */
import "@blocknote/mantine/style.css";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

interface BlockNoteEditorClientProps {
  initialContent: object[];
  onContentChange: (content: object[]) => void;
}

export default function BlockNoteEditorClient({
  initialContent,
  onContentChange,
}: BlockNoteEditorClientProps) {
  const editor = useCreateBlockNote({
    initialContent: initialContent?.length
      ? (initialContent as Parameters<typeof useCreateBlockNote>[0] extends {
          initialContent?: infer C;
        }
          ? C
          : never)
      : undefined,
  });

  return (
    <BlockNoteView
      editor={editor}
      onChange={() => onContentChange(editor.document as object[])}
      theme="dark"
      data-theming-css-variables-demo
    />
  );
}
