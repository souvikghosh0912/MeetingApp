// =============================================================
// Core Domain Types
// =============================================================

export type Plan = "free" | "pro" | "team";
export type FileType = "audio" | "video";
export type ModelType = "llama-8b" | "gpt-oss-20b" | "gpt-oss-120b";
export type TranscriptModelType = "nova-3" | "whisper-v3";
export type TranscriptStatus =
  | "pending"
  | "uploading"
  | "transcribing"
  | "summarizing"
  | "done"
  | "error";

export type StudyStatus =
  | "idle"
  | "uploading"
  | "extracting"
  | "summarizing"
  | "done"
  | "error";

export type StudyDifficulty = "beginner" | "intermediate" | "advanced";
export type Sentiment = "positive" | "neutral" | "negative" | "mixed";
export type Priority = "high" | "medium" | "low";

// =============================================================
// Database Row Types
// =============================================================

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  task: string;
  owner: string | null;
  priority: Priority;
}

export interface Topic {
  name: string;
  summary: string;
}

export interface WorkflowNode {
  id: string;
  type?: string; 
  position: { x: number; y: number };
  data: {
    label: string;
    description: string;
    type: "start" | "event" | "topic" | "decision" | "action" | "end";
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
}

export interface Highlight {
  title: string;
  type: "decision" | "action" | "key_point";
  start: number;
  end: number;
}

export type SpeakerNames = Record<string, string>;

export interface Summary {
  tldr: string[];
  topics: Topic[];
  action_items: ActionItem[];
  decisions: string[];
  sentiment: Sentiment;
  sentiment_explanation: string;
  workflow?: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  media_path?: string;
  segments?: TranscriptSegment[];
  highlights?: Highlight[];
  speaker_names?: SpeakerNames;
}

export interface Transcript {
  id: string;
  user_id: string;
  title: string;
  duration_seconds: number | null;
  file_type: FileType | null;
  transcript_text: string | null;
  summary: Summary | null;
  model_used: ModelType;
  transcript_model_used?: TranscriptModelType;
  share_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  date: string;
  visualizations_count: number;
  summaries_8b_count: number;
  summaries_20b_count: number;
  summaries_120b_count: number;
}

// =============================================================
// API Request/Response Types
// =============================================================

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  speaker?: string;
}

export interface TranscribeRequest {
  storagePath: string;
  fileName: string;
  transcriptModel: TranscriptModelType;
}

export interface TranscribeResponse {
  transcript: string;
  segments: TranscriptSegment[];
  duration?: number;
}

export interface SummarizeRequest {
  transcript: string;
  model: ModelType;
  transcriptId: string;
}

export interface SummarizeResponse {
  summary: Summary;
}

export interface CreateTranscriptRequest {
  title: string;
  duration_seconds?: number;
  file_type: FileType;
  transcript_text: string;
  summary: Summary;
  model_used: ModelType;
}

// =============================================================
// Plan Limit Types
// =============================================================

export interface PlanLimits {
  visualizationsPerWeek: number | "unlimited";
  summaries8bPerDay: number | "unlimited";
  summaries20bPerDay: number | "unlimited";
  summaries120bPerDay: number | "unlimited";
  maxSavedTranscripts: number | "unlimited";
  summaryLength: "short" | "long";
}

// =============================================================
// Upload State
// =============================================================

export interface UploadState {
  status: TranscriptStatus;
  progress: number;
  error?: string;
  transcriptId?: string;
}

// =============================================================
// Page / Notion feature types
// =============================================================

export interface PageMeta {
  id: string;
  title: string;
  icon: string;
  cover: string | null;
  parent_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  document_id: string;
  document_type: "meeting" | "study";
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface PageComment {
  id: string;
  page_id: string;
  user_id: string;
  content: string;
  resolved: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  author_name?: string;
  author_avatar?: string | null;
}

export type FavoriteItemType = "page" | "database" | "transcript";

export interface UserFavorite {
  id: string;
  user_id: string;
  item_type: FavoriteItemType;
  item_id: string;
  title: string;
  icon: string;
  created_at: string;
}

export interface RecentItem {
  id: string;
  user_id: string;
  item_type: FavoriteItemType;
  item_id: string;
  title: string;
  icon: string;
  visited_at: string;
}

// =============================================================
// UI Types
// =============================================================

export interface PricingTier {
  name: string;
  price: string;
  description: string;
  limits: PlanLimits;
  features: string[];
  cta: string;
  highlighted: boolean;
}

// =============================================================
// Study System Types
// =============================================================

export interface StudyActionItem {
  task: string;
  priority: Priority;
  page_reference?: string;
}

export interface StudyPageSummary {
  key_concepts: string[];
  summary: string;
  action_items: StudyActionItem[];
  difficulty: StudyDifficulty;
  estimated_read_minutes: number;
  topics?: string[];
}

export interface StudyPage {
  id: string;
  user_id: string;
  title: string;
  source_image_path: string | null;
  extracted_text: string | null;
  summary: StudyPageSummary | null;
  model_used: ModelType;
  created_at: string;
  updated_at: string;
}

export interface StudyFlashcard {
  id: string;
  user_id: string;
  study_page_id: string;
  front: string;
  back: string;
  next_review: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  created_at: string;
  updated_at: string;
}
