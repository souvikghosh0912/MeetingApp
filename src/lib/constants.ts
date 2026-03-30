import { Plan, PlanLimits } from "@/types";

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    visualizationsPerWeek: 8,
    summaries8bPerDay: 4,
    summaries20bPerDay: 2,
    summaries120bPerDay: 1,
    maxSavedTranscripts: 10,
    summaryLength: "short",
  },
  pro: {
    visualizationsPerWeek: "unlimited",
    summaries8bPerDay: 30,
    summaries20bPerDay: 20,
    summaries120bPerDay: 10,
    maxSavedTranscripts: 100,
    summaryLength: "long",
  },
  team: {
    visualizationsPerWeek: "unlimited",
    summaries8bPerDay: "unlimited",
    summaries20bPerDay: 60,
    summaries120bPerDay: 30,
    maxSavedTranscripts: "unlimited",
    summaryLength: "long",
  },
};

export const PLAN_NAMES: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

export const PLAN_PRICES: Record<Plan, string> = {
  free: "₹0",
  pro: "₹399",
  team: "₹999",
};

export const MODEL_NAMES = {
  "llama-8b": "LLaMA 3.1 8B",
  "gpt-oss-20b": "GPT-OSS 20B",
  "gpt-oss-120b": "GPT-OSS 120B",
} as const;

// NVIDIA NIM model identifiers
export const NIM_MODELS = {
  "llama-8b": "meta/llama-3.1-8b-instruct",
  "gpt-oss-20b": "openai/gpt-oss-20b",
  "gpt-oss-120b": "openai/gpt-oss-120b",
  whisper: "nvidia/whisper-large-v3",
} as const;

export const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";
