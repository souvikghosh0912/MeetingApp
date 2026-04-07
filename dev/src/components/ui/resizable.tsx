"use client";

import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { GroupProps, PanelProps, SeparatorProps } from "react-resizable-panels";
import { cn } from "@/lib/utils";

// ── Re-exported primitives with our own naming convention ──────────────────────

export const ResizablePanelGroup = ({
  className,
  ...props
}: GroupProps) => (
  <Group
    className={cn(
      "flex h-full w-full data-[orientation=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

export const ResizablePanel = (props: PanelProps) => <Panel {...props} />;

// ── Styled Separator / Handle ──────────────────────────────────────────────────

type ResizableHandleProps = SeparatorProps & { withHandle?: boolean };

export const ResizableHandle = ({
  className,
  withHandle,
  ...props
}: ResizableHandleProps) => (
  <Separator
    className={cn(
      // Base: thin line, expands hit target via pseudo-element
      "relative flex shrink-0 items-center justify-center",
      "w-px bg-white/10",
      "transition-colors duration-150",
      // Hover / active state supplied by data-separator attribute
      "data-[active]:bg-violet-500/60 hover:bg-violet-500/40",
      // Vertical orientation
      "data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full",
      // Expanded click area
      "after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
      "data-[orientation=vertical]:after:inset-x-0 data-[orientation=vertical]:after:top-1/2 data-[orientation=vertical]:after:h-4 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:after:translate-x-0",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-5 w-3.5 items-center justify-center rounded border border-white/15 bg-[#161616] shadow-md">
        <GripVertical className="h-3 w-3 text-white/40" />
      </div>
    )}
  </Separator>
);
