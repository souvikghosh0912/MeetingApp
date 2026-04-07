-- ============================================================
-- 011_study_pages.sql
-- Study pages: OCR-extracted text + AI summaries of book pages
-- ============================================================

create table if not exists public.study_pages (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null default 'Untitled Study Page',
  source_image_path text,       -- Supabase Storage path to the uploaded image
  extracted_text  text,         -- Raw OCR output from NIM vision model
  summary         jsonb,        -- StudyPageSummary shape (key_concepts, summary, action_items, …)
  model_used      text not null default 'llama-8b',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists study_pages_user_id_idx
  on public.study_pages (user_id, created_at desc);

-- ── Updated-at trigger (reuse the pattern from transcripts) ─────────────────
create or replace function public.update_study_pages_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists study_pages_updated_at on public.study_pages;
create trigger study_pages_updated_at
  before update on public.study_pages
  for each row execute function public.update_study_pages_updated_at();

-- ── Row-Level Security ───────────────────────────────────────────────────────
alter table public.study_pages enable row level security;

create policy "Users can view their own study pages"
  on public.study_pages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own study pages"
  on public.study_pages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own study pages"
  on public.study_pages for update
  using (auth.uid() = user_id);

create policy "Users can delete their own study pages"
  on public.study_pages for delete
  using (auth.uid() = user_id);

-- ── Storage bucket for study images ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('study-images', 'study-images', false)
on conflict (id) do nothing;

create policy "Users can upload their own study images"
  on storage.objects for insert
  with check (bucket_id = 'study-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read their own study images"
  on storage.objects for select
  using (bucket_id = 'study-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own study images"
  on storage.objects for delete
  using (bucket_id = 'study-images' and auth.uid()::text = (storage.foldername(name))[1]);
