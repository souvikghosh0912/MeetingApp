-- Migration: 012_chat_history

-- 1. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL, -- Logical reference to either transcripts(id) or study_pages(id)
    document_type TEXT NOT NULL CHECK (document_type IN ('meeting', 'study')),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes for faster history retrieval
CREATE INDEX IF NOT EXISTS idx_chat_messages_document_id ON public.chat_messages(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- 3. Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can insert their own chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chat messages"
    ON public.chat_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages"
    ON public.chat_messages FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages"
    ON public.chat_messages FOR DELETE
    USING (auth.uid() = user_id);
