"use client";

import { useState, useEffect, useCallback } from "react";
import { StudyFlashcard } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCw, BrainCircuit, Frown, BookOpen, Check, Layers, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface FlashcardViewerProps {
  studyPageId: string;
}

export function FlashcardViewer({ studyPageId }: FlashcardViewerProps) {
  const [cards, setCards] = useState<StudyFlashcard[]>([]);
  const [dueCards, setDueCards] = useState<StudyFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    
    const { data } = await supabase
      .from("study_flashcards")
      .select("*")
      .eq("study_page_id", studyPageId)
      .order("next_review", { ascending: true });

    if (data) {
      setCards(data);
      const now = new Date();
      const due = data.filter(c => new Date(c.next_review) <= now);
      setDueCards(due);
    }
    
    setIsLoading(false);
  }, [studyPageId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/study/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyPageId })
      });
      if (res.ok) {
        await fetchCards();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRate = async (rating: number) => {
    const currentCard = dueCards[currentIndex];
    
    // Optimistically go to next card
    setIsFlipped(false);
    setTimeout(() => {
      setDueCards(prev => prev.filter((_, i) => i !== currentIndex));
      // currentIndex stays 0 because we remove the current one, the next one shifts to 0
    }, 200);

    try {
      await fetch("/api/study/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: currentCard.id, rating })
      });
    } catch (err) {
      console.error(err);
      // In a real app we might revert the optimistic update here
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border border-white/10 bg-white/5 rounded-xl">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  // No cards exist yet for this document
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-white/10 bg-white/5 rounded-xl space-y-4">
        <div className="h-16 w-16 bg-violet-500/20 rounded-full flex items-center justify-center mb-2">
          <BrainCircuit className="h-8 w-8 text-violet-400" />
        </div>
        <h3 className="text-xl font-bold text-white">No Flashcards Yet</h3>
        <p className="text-sm text-white/50 max-w-sm">
          Generate spaced repetition flashcards using AI to test your knowledge on this document.
        </p>
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="bg-violet-600 hover:bg-violet-500 text-white mt-4"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Layers className="mr-2 h-4 w-4" />
              Generate Flashcards
            </>
          )}
        </Button>
      </div>
    );
  }

  // Cards exist, but none are due right now
  if (dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-emerald-500/20 bg-emerald-500/5 rounded-xl space-y-4">
        <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white">All Caught Up!</h3>
        <p className="text-sm text-white/50 max-w-sm">
          You&apos;ve reviewed all {cards.length} flashcards. Check back later for your next spaced repetition session.
        </p>
        <Button 
          variant="outline"
          onClick={() => {
             // Optional: let them practice anyway (cram mode)
             setDueCards([...cards].sort(() => 0.5 - Math.random()));
             setCurrentIndex(0);
          }}
          className="mt-4 border-white/10 text-white hover:bg-white/10"
        >
          <Play className="mr-2 h-4 w-4" />
          Practice Anyway (Cram Mode)
        </Button>
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full space-y-8">
      
      {/* Progress */}
      <div className="w-full flex items-center justify-between text-sm text-white/50 font-medium px-2">
        <span>Cards Due: {dueCards.length}</span>
        <span>Total: {cards.length}</span>
      </div>

      {/* The Card */}
      <div 
        className="relative w-full aspect-[4/3] md:aspect-[3/2] cursor-pointer group perspective-[1000px]"
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className={cn(
          "w-full h-full transition-all duration-500 [transform-style:preserve-3d] relative",
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        )}>
           {/* Front */}
           <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-2xl border border-white/10 bg-black flex flex-col items-center justify-center p-8 md:p-12 text-center shadow-lg hover:border-violet-500/50 transition-colors">
              <span className="absolute top-4 left-4 text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Front
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {currentCard.front}
              </h2>
              <div className="absolute bottom-6 flex items-center gap-2 text-white/30 text-sm animate-pulse">
                <RotateCw className="w-4 h-4" />
                Click to flip
              </div>
           </div>

           {/* Back */}
           <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border border-violet-500/30 bg-[#0a0a0a] flex flex-col p-8 md:p-12 shadow-lg overflow-y-auto">
              <span className="absolute top-4 left-4 text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Back
              </span>
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium">
                  {currentCard.back}
                </p>
              </div>
           </div>
        </div>
      </div>

      {/* Controls */}
      <div className={cn(
        "flex items-center gap-3 w-full transition-opacity duration-300",
        isFlipped ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-4"
      )}>
        <Button 
          variant="outline" 
          onClick={(e) => { e.stopPropagation(); handleRate(1); }}
          className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-12"
        >
          <Frown className="h-4 w-4 mr-2" />
          Again (1m)
        </Button>
        <Button 
          variant="outline" 
          onClick={(e) => { e.stopPropagation(); handleRate(3); }}
          className="flex-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 h-12"
        >
          Hard ({currentCard.interval >= 1 ? currentCard.interval : 1}d)
        </Button>
        <Button 
          variant="outline" 
          onClick={(e) => { e.stopPropagation(); handleRate(4); }}
          className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 h-12"
        >
          Good ({currentCard.interval >= 1 ? currentCard.interval * 2 : 2}d)
        </Button>
        <Button 
          variant="outline" 
          onClick={(e) => { e.stopPropagation(); handleRate(5); }}
          className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 h-12"
        >
          Easy ({(currentCard.interval >= 1 ? currentCard.interval * 2.5 : 4).toFixed(0)}d)
        </Button>
      </div>

    </div>
  );
}
