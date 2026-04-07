import { Bot, Loader2 } from "lucide-react";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInputBox } from "./ChatInputBox";
import { useChatManager } from "@/hooks/useChatManager";

export interface ChatInterfaceProps {
  transcriptId: string;
  transcriptTitle: string;
}

export function ChatInterface({ transcriptId, transcriptTitle }: ChatInterfaceProps) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    isHistoryLoading,
    modelId,
    setModelId,
    handleSubmit
  } = useChatManager({
    documentId: transcriptId,
    documentType: "meeting",
    apiEndpoint: "/api/chat",
  });

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden relative">
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-24 space-y-6 custom-scrollbar bg-transparent pb-32">
        {isHistoryLoading ? (
          <div className="flex h-full items-center justify-center opacity-50">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <div className="h-20 w-20 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mb-6 shadow-glow mix-blend-screen">
               <Bot className="h-10 w-10 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">How can I help you?</h3>
            <p className="text-sm text-text-muted max-w-sm">
              Ask me anything about what was discussed, decided, or assigned in this meeting context.
            </p>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <ChatMessageBubble 
                key={m.id} 
                id={m.id} 
                role={m.role} 
                content={m.content} 
                type="meeting" 
              />
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 text-accent animate-spin" />
                  </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <ChatInputBox 
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        modelId={modelId}
        setModelId={setModelId}
        type="meeting"
        placeholder="Ask a question about this meeting..."
      />
    </div>
  );
}
