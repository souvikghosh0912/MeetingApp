"use client";

import { useState, useRef } from "react";
import { User, Bot, CheckCheck, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

// ── Copy Code Component
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

// ── Message Bubble Component
export interface ChatMessageBubbleProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "meeting" | "study";
}

export function ChatMessageBubble({ role, content, type }: ChatMessageBubbleProps) {
  // Theme colors based on the Document Type
  const themeColorClass = type === "study" ? "text-violet-400" : "text-accent";
  const userBgClass = type === "study" ? "bg-violet-600 border-violet-500" : "bg-accent/90 border-accent";
  const assistantAvatarBgClass = type === "study" ? "bg-violet-400/20 border-violet-400/30" : "bg-accent/20 border-accent/30";

  return (
    <div className={cn("flex gap-3 md:gap-4", role === "user" ? "justify-end" : "justify-start")}>
      {/* Assistant Avatar */}
      {role === "assistant" && (
        <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-full border flex items-center justify-center shrink-0 shadow-md", assistantAvatarBgClass)}>
          <Bot className={cn("h-4 w-4 md:h-5 md:w-5", themeColorClass)} />
        </div>
      )}
      
      {/* Message Content Area */}
      <div className={cn(
        "max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-md",
        role === "user" 
          ? cn("text-white rounded-tr-sm border", userBgClass) 
          : "bg-[#141414] border border-white/10 text-text-secondary rounded-tl-sm"
      )}>
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
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* User Avatar */}
      {role === "user" && (
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-md">
          <User className="h-4 w-4 md:h-5 md:w-5 text-white/70" />
        </div>
      )}
    </div>
  );
}
