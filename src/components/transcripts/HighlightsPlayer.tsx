"use client";

import { useState, useRef, useEffect } from "react";
import { Highlight } from "@/types";
import { cn } from "@/lib/utils";
import { PlayCircle, Volume2, CheckCircle2, Lightbulb } from "lucide-react";

interface HighlightsPlayerProps {
  mediaUrl?: string;
  fileType?: "audio" | "video" | string;
  highlights: Highlight[];
}

export function HighlightsPlayer({ mediaUrl, fileType, highlights }: HighlightsPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRef = useRef<HTMLMediaElement>(null);
  
  const activeHighlight = highlights[currentIndex];

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
      
      // Auto-pause if we hit the end of the current highlight
      if (activeHighlight && media.currentTime >= activeHighlight.end) {
        media.pause();
        // Snap to exact end to prevent drifting
        if (media.currentTime > activeHighlight.end + 0.5) {
            media.currentTime = activeHighlight.end;
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("play", handlePlay);
    media.addEventListener("pause", handlePause);
    
    return () => {
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("play", handlePlay);
      media.removeEventListener("pause", handlePause);
    };
  }, [activeHighlight]);

  // When active highlight changes via sidebar, jump to start
  useEffect(() => {
    if (mediaRef.current && activeHighlight) {
      mediaRef.current.currentTime = activeHighlight.start;
      mediaRef.current.play().catch(() => {});
    }
  }, [currentIndex, activeHighlight]);

  const handleSeek = (index: number) => {
    setCurrentIndex(index);
    if (mediaRef.current) {
      mediaRef.current.currentTime = highlights[index].start;
      mediaRef.current.play().catch(() => {});
    }
  };

  const isVideo = fileType === "video";

  if (!highlights || highlights.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 rounded-2xl border border-white/10 bg-white/5">
        <p className="text-text-muted">No highlights to display.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Player Section */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {mediaUrl && (
          <div className={cn(
            "w-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-black/40 backdrop-blur-md",
            !isVideo && "p-6"
          )}>
            {isVideo ? (
              <video 
                ref={mediaRef as React.RefObject<HTMLVideoElement>} 
                src={mediaUrl} 
                className="w-full h-auto max-h-[600px] object-contain bg-black"
                controls
                controlsList="nodownload" 
              />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-accent" />
                  <span className="text-base font-semibold text-white">Audio Highlight Reel</span>
                </div>
                <audio 
                  ref={mediaRef as React.RefObject<HTMLAudioElement>} 
                  src={mediaUrl} 
                  controls 
                  className="w-full custom-audio-player" 
                  controlsList="nodownload"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Current Highlight Info */}
        <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            {activeHighlight.type === "decision" ? (
              <Lightbulb className="w-5 h-5 text-yellow-400" />
            ) : activeHighlight.type === "action" ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <PlayCircle className="w-5 h-5 text-accent" />
            )}
            <span className="text-sm font-semibold tracking-wider uppercase text-text-secondary">
              Now Playing: {activeHighlight.type.replace("_", " ")}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">
            {activeHighlight.title}
          </h2>
        </div>
      </div>

      {/* Playlist Sidebar */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Highlight Playlist ({highlights.length})
        </h3>
        <div className="flex-1 overflow-y-auto max-h-[700px] space-y-3 custom-scrollbar pr-2">
          {highlights.map((h, idx) => {
            const isActive = idx === currentIndex;
            
            return (
              <button
                key={idx}
                onClick={() => handleSeek(idx)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all duration-300 group",
                  isActive 
                    ? "bg-accent/20 border-accent/40 shadow-[0_0_15px_rgba(37,99,235,0.15)]" 
                    : "bg-white/3 border-white/5 hover:bg-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 mt-0.5 shrink-0">
                    {h.type === "decision" ? (
                       <Lightbulb className={cn("w-4 h-4", isActive ? "text-yellow-400" : "text-yellow-400/50 group-hover:text-yellow-400")} />
                    ) : h.type === "action" ? (
                      <CheckCircle2 className={cn("w-4 h-4", isActive ? "text-green-400" : "text-green-400/50 group-hover:text-green-400")} />
                    ) : (
                      <PlayCircle className={cn("w-4 h-4", isActive ? "text-accent" : "text-text-muted group-hover:text-accent")} />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn(
                      "text-sm font-medium transition-colors line-clamp-2",
                      isActive ? "text-white" : "text-white/80 group-hover:text-white"
                    )}>
                      {h.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                      <span>{formatTime(h.start)}</span>
                      <span>-</span>
                      <span>{formatTime(h.end)}</span>
                    </div>
                  </div>
                  {isActive && isPlaying && (
                    <div className="flex gap-1 items-center h-4 shadow-sm shrink-0">
                      <span className="w-1 h-3 bg-accent rounded-full animate-[bounce_1s_infinite_0s]"></span>
                      <span className="w-1 h-4 bg-accent rounded-full animate-[bounce_1s_infinite_0.2s]"></span>
                      <span className="w-1 h-2 bg-accent rounded-full animate-[bounce_1s_infinite_0.4s]"></span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
