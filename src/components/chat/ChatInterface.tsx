"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Bot, User, Loader2, ArrowLeft, ArrowRight, Check, ChevronDown, Paperclip, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

// Copy-code button for code blocks
function CodeBlock({ children, className, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = async () => {
    const text = codeRef.current?.innerText ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 rounded-md p-1.5"
        title="Copy code"
      >
        {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
      </button>
      <code ref={codeRef} className={className} {...props}>
        {children}
      </code>
    </div>
  );
}

interface ChatInterfaceProps {
  transcriptId: string;
  transcriptTitle: string;
}

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
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

export function ChatInterface({ transcriptId, transcriptTitle }: ChatInterfaceProps) {
  const [modelId, setModelId] = useState<"8b" | "20b">("8b");
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 56,
    maxHeight: 200,
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    adjustHeight(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, transcriptId, modelId }),
      });

      if (!response.ok) throw new Error("API response error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let assistantMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        assistantMessage.content += chunkText;
        
        setMessages(prev => 
          prev.map(m => (m.id === assistantMessage.id ? { ...m, content: assistantMessage.content } : m))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden relative">
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-24 space-y-6 custom-scrollbar bg-transparent pb-32">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <div className="h-20 w-20 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mb-6 shadow-glow mix-blend-screen">
               <Bot className="h-10 w-10 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">How can I help you?</h3>
            <p className="text-sm text-text-muted max-w-sm">
              Ask me anything about what was discussed, decided, or assigned in this meeting context.
            </p>
          </div>
        )}

        {messages.map((m: any) => (
          <div key={m.id} className={`flex gap-3 md:gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 shadow-md">
                <Bot className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
            )}
            
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-md ${
              m.role === 'user' 
                ? 'bg-accent/90 text-white rounded-tr-sm border border-accent' 
                : 'bg-[#141414] border border-white/10 text-text-secondary rounded-tl-sm'
            }`}>
              <div className="prose prose-invert prose-sm md:prose-base max-w-none leading-relaxed prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-none prose-headings:font-bold">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    pre: ({ children, ...props }) => (
                      <pre {...props} className="bg-[#0d0d0d] border border-white/8 rounded-xl overflow-hidden my-3">
                        {children}
                      </pre>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isBlock = className?.startsWith("language-");
                      if (isBlock) return <CodeBlock className={cn("block p-4 overflow-x-auto text-sm", className)} {...props}>{children}</CodeBlock>;
                      return <code className={className} {...props}>{children}</code>;
                    },
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-md">
                <User className="h-4 w-4 md:h-5 md:w-5 text-white/70" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 justify-start">
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                <Loader2 className="h-4 w-4 md:h-5 md:w-5 text-accent animate-spin" />
              </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 md:px-8 lg:px-24 shrink-0 relative z-50 bg-gradient-to-t from-black via-black/80 to-transparent pb-6 pt-12">
        <div className="max-w-4xl mx-auto w-full">
            <div className="bg-black/20 border border-white/10 rounded-2xl p-1.5 focus-within:ring-1 focus-within:ring-accent transition-all duration-300 shadow-lg">
                <div className="relative flex flex-col">
                    <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: "200px" }}>
                        <Textarea
                            id="ai-input"
                            value={input}
                            placeholder="Ask a question about this meeting..."
                            className={cn(
                                "w-full rounded-xl rounded-b-none px-4 py-4 bg-transparent border-none text-white placeholder:text-white/40 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed",
                                "min-h-[56px]"
                            )}
                            ref={textareaRef}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey && input.trim() && !isLoading) {
                                e.preventDefault();
                                handleSubmit();
                              }
                            }}
                            onChange={(e) => {
                                setInput(e.target.value);
                                adjustHeight();
                            }}
                            disabled={isLoading}
                        />
                    </div>

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
                                                <Bot className={modelId === "8b" ? "w-4 h-4 text-white" : "w-4 h-4 text-accent"} />
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
                                            <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                                              <Bot className="w-4 h-4 text-accent" />
                                            </div>
                                            <span className="font-medium text-accent">Smart (20B GPT-OSS)</span>
                                        </div>
                                        {modelId === "20b" && <Check className="w-4 h-4 text-accent" />}
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
                                "flex items-center justify-center rounded-xl p-3 bg-accent hover:bg-accent/80 transition-all",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 group shadow-lg"
                            )}
                            disabled={!input.trim() || isLoading}
                            onClick={() => handleSubmit()}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ArrowRight className="w-4 h-4 text-white group-disabled:text-white/50" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
