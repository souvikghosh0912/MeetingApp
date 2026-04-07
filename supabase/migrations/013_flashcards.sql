-- Migration: Add study_flashcards table for Spaced Repetition System

CREATE TABLE IF NOT EXISTS study_flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    study_page_id UUID NOT NULL REFERENCES study_pages(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    next_review TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    interval INT NOT NULL DEFAULT 0,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    repetitions INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS study_flashcards_user_id_idx ON study_flashcards(user_id);
CREATE INDEX IF NOT EXISTS study_flashcards_study_page_id_idx ON study_flashcards(study_page_id);
CREATE INDEX IF NOT EXISTS study_flashcards_next_review_idx ON study_flashcards(next_review);

-- Row Level Security
ALTER TABLE study_flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own flashcards" 
    ON study_flashcards FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards" 
    ON study_flashcards FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" 
    ON study_flashcards FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" 
    ON study_flashcards FOR DELETE 
    USING (auth.uid() = user_id);
