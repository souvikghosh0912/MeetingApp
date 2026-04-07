"use client";

import { useRef, useCallback, useEffect } from "react";
import { ArrowRight, Bot, Check, ChevronDown, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Auto-resize hook
function useAutoResizeTextarea(minHeight: number, maxHeight?: number) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY));
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

export interface ChatInputBoxProps {
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  modelId: "8b" | "20b";
  setModelId: (val: "8b" | "20b") => void;
  type: "meeting" | "study";
  placeholder?: string;
}

export function ChatInputBox({
  input,
  setInput,
  isLoading,
  onSubmit,
  modelId,
  setModelId,
  type,
  placeholder = "Ask a question...",
}: ChatInputBoxProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea(56, 200);

  // Theme colors
  const focusRingClass = type === "study" ? "focus-within:ring-violet-500" : "focus-within:ring-accent";
  const buttonBgClass = type === "study" ? "bg-violet-600 hover:bg-violet-500" : "bg-accent hover:bg-accent/80";
  const iconColorClass = type === "study" ? "text-violet-400" : "text-accent";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && input.trim() && !isLoading) {
      e.preventDefault();
      adjustHeight(true);
      onSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  };

  return (
    <div className="p-4 md:px-8 lg:px-24 shrink-0 relative z-50 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-transparent pb-6 pt-12">
      <div className="max-w-4xl mx-auto w-full">
        <div className={cn(
          "bg-black/20 border border-white/10 rounded-2xl p-1.5 transition-all duration-300 shadow-lg",
          focusRingClass
        )}>
          <div className="relative flex flex-col">
            <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: "200px" }}>
              <Textarea
                id="ai-input"
                value={input}
                placeholder={placeholder}
                className={cn(
                  "w-full rounded-xl rounded-b-none px-4 py-4 bg-transparent border-none text-white placeholder:text-white/40 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed",
                  "min-h-[56px]"
                )}
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Toolbar */}
            <div className="h-12 bg-transparent rounded-b-xl flex items-center px-3 justify-between mt-1">
              <div className="flex items-center gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 h-9 pl-3 pr-3 text-xs rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={modelId}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <Bot className={modelId === "8b" ? "w-4 h-4 text-white" : cn("w-4 h-4", iconColorClass)} />
                          <span className="font-semibold">{modelId === "8b" ? "Fast (8B NIM)" : "Smart (20B GPT-OSS)"}</span>
                          <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                        </motion.div>
                      </AnimatePresence>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[14rem] border-white/10 bg-black/95 backdrop-blur-xl text-white rounded-xl shadow-2xl p-2 gap-1 flex flex-col">
                    <DropdownMenuItem onSelect={() => setModelId("8b")} className="flex items-center justify-between gap-2 cursor-pointer focus:bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white/80" />
                        </div>
                        <span className="font-medium">Fast (8B NIM)</span>
                      </div>
                      {modelId === "8b" && <Check className="w-4 h-4 text-white" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setModelId("20b")} className="flex items-center justify-between gap-2 cursor-pointer focus:bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full border flex items-center justify-center", type === "study" ? "bg-violet-400/10 border-violet-400/20" : "bg-accent/10 border-accent/20")}>
                          <Bot className={cn("w-4 h-4", iconColorClass)} />
                        </div>
                        <span className={cn("font-medium", iconColorClass)}>Smart (20B GPT-OSS)</span>
                      </div>
                      {modelId === "20b" && <Check className={cn("w-4 h-4", iconColorClass)} />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-5 w-px bg-white/10 mx-2" />
                
                <label className="rounded-xl p-2 cursor-pointer hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Attach file">
                  <input type="file" className="hidden" />
                  <Paperclip className="w-4 h-4" />
                </label>
              </div>

              <button
                type="button"
                className={cn(
                  "flex items-center justify-center rounded-xl p-3 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 group shadow-lg",
                  buttonBgClass
                )}
                disabled={!input.trim() || isLoading}
                onClick={() => {
                  adjustHeight(true);
                  onSubmit();
                }}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ArrowRight className="w-4 h-4 text-white group-disabled:text-white/50" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
