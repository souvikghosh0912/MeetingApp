import OpenAI from "openai";
import { createClient as createDeepgramClient } from "@deepgram/sdk";
import { NIM_BASE_URL, NIM_MODELS } from "@/lib/constants";
import { ModelType, Summary, TranscriptModelType, TranscriptSegment, Highlight } from "@/types";

// ─── DEEPGRAM client for Transcription (supports speaker diarization) ───────
function getDeepgramClient() {
  if (!process.env.DEEPGRAM_API_KEY) {
    throw new Error(
      "DEEPGRAM_API_KEY is not configured. Get a free key at console.deepgram.com"
    );
  }
  return createDeepgramClient(process.env.DEEPGRAM_API_KEY);
}

// ─── Groq client for Whisper v3 ─────────────────────────────────────────────
function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

// ─── NVIDIA NIM client for LLaMA summarization ──────────────────────────────
function getNimClient() {
  if (!process.env.NVIDIA_NIM_API_KEY) {
    throw new Error("NVIDIA_NIM_API_KEY is not configured");
  }
  return new OpenAI({
    apiKey: process.env.NVIDIA_NIM_API_KEY,
    baseURL: NIM_BASE_URL,
  });
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  model: TranscriptModelType = "whisper-v3"
): Promise<{ text: string; segments: TranscriptSegment[] }> {
  if (model === "whisper-v3") {
    const client = getGroqClient();
    const fileOptions = { type: getContentType(fileName) };
    const file = new File([new Uint8Array(audioBuffer)], fileName, fileOptions);
    
    // Require verbose_json to extract timestamp segments
    const response = await client.audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });
    
    const rawSegments = (response as any).segments || [];
    const segments: TranscriptSegment[] = rawSegments.map((s: any) => ({
      text: s.text,
      start: s.start,
      end: s.end,
    }));

    // If segments are missing for some reason, provide a fallback
    if (segments.length === 0 && response.text) {
      segments.push({ text: response.text, start: 0, end: Number.POSITIVE_INFINITY });
    }
    
    return { text: response.text, segments };
  }

  // Fallback to Deepgram Nova-3
  const deepgram = getDeepgramClient();

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    {
      model: "nova-3",
      smart_format: true,
      diarize: true,
      paragraphs: true,
    }
  );

  if (error || !result) {
    throw new Error(`Deepgram transcription failed: ${error?.message || "Unknown error"}`);
  }

  const paragraphs = result.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs;
  
  // If we have paragraph data with speakers (diarization), extract segments precisely
  if (paragraphs && paragraphs.length > 0) {
    // Map numeric speaker IDs (0, 1, 2…) → "Speaker A", "Speaker B", etc.
    const speakerMap = new Map<number, string>();
    const getSpeakerLabel = (id: number): string => {
      if (!speakerMap.has(id)) {
        speakerMap.set(id, `Speaker ${String.fromCharCode(65 + speakerMap.size)}`);
      }
      return speakerMap.get(id)!;
    };

    const formattedSegments: TranscriptSegment[] = paragraphs.map((p: any) => ({
      text: p.sentences.map((s: any) => s.text).join(" "),
      start: p.sentences[0]?.start ?? 0,
      end: p.sentences[p.sentences.length - 1]?.end ?? Number.POSITIVE_INFINITY,
      speaker: getSpeakerLabel(p.speaker),
    }));

    const formattedTranscript = formattedSegments.map(s => `[${s.speaker}]: ${s.text}`).join("\n\n");
    return { text: formattedTranscript, segments: formattedSegments };
  }

  // Fallback to plain transcript if diarization fails or only 1 speaker detected
  const plainTranscript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  return { 
    text: plainTranscript, 
    segments: [{ text: plainTranscript, start: 0, end: Number.POSITIVE_INFINITY }] 
  };
}

// ─── Summarization via NVIDIA NIM GPT-OSS Series ────────────────────────────
export async function summarizeTranscript(
  transcript: string,
  model: ModelType,
  summaryLength: "short" | "long"
): Promise<Summary> {
  const client = getNimClient();

  const lengthInstruction =
    summaryLength === "short"
      ? "Keep each section concise — max 3 bullet points for TL;DR, max 3 topics, max 5 action items."
      : "Be thorough and detailed — include all key points, up to 8 bullet points for TL;DR, all major topics, and all action items.";

  const systemPrompt = `You are an expert meeting analyst. Analyze the provided meeting transcript and return a structured JSON summary.

${lengthInstruction}

Return ONLY valid JSON matching this exact schema:
{
  "tldr": ["string"],
  "topics": [{"name": "string", "summary": "string"}],
  "action_items": [{"task": "string", "owner": "string or null", "priority": "high|medium|low"}],
  "decisions": ["string"],
  "sentiment": "positive|neutral|negative|mixed",
  "sentiment_explanation": "string"
}

Rules:
- tldr: Key takeaways as concise bullet points
- topics: Main discussion themes with brief summaries
- action_items: Specific tasks to be done, with owner if mentioned
- decisions: Concrete decisions made during the meeting
- sentiment: Overall tone of the meeting
- DO NOT include any text outside the JSON object`;

  const completion = await client.chat.completions.create({
    model: NIM_MODELS[model as keyof typeof NIM_MODELS] || NIM_MODELS["gpt-oss-120b"],
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Here is the meeting transcript:\n\n${transcript}`,
      },
    ],
    temperature: 0.3,
    max_tokens: summaryLength === "short" ? 1024 : 4096,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from summarization model");

  try {
    const cleaned = cleanJson(content);
    const parsed = JSON.parse(cleaned);
    return parsed as Summary;
  } catch (err) {
    console.error("JSON Parse Error:", err, "Raw Content:", content);
    throw new Error("Failed to parse summarization response as JSON");
  }
}

function cleanJson(text: string): string {
  // Remove markdown code blocks if they exist
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?|```$/g, "").trim();
  }
  return cleaned;
}

// ─── Extract Highlights with Timestamps ────────────────────────────────────────
export async function generateHighlights(
  transcriptText: string,
  segments: TranscriptSegment[],
  model: ModelType = "gpt-oss-120b"
): Promise<Highlight[]> {
  const client = getNimClient();

  // Create a condensed map of segments to save tokens if it's too long, but for now we pass full segments
  // We can just pass the stringified segments
  const systemPrompt = `You are a meeting analysis expert. Extract the key action items, decisions, and major discussion points from this transcript, and map them to their EXACT start and end timestamps in seconds.
You are provided with the transcript and an array of JSON segments containing the text and their exact start/end times.

Return ONLY valid JSON matching this exact schema:
{
  "highlights": [
    {
      "title": "Short descriptive title of the decision or action",
      "type": "decision" | "action" | "key_point",
      "start": number (in seconds),
      "end": number (in seconds)
    }
  ]
}

Rules:
- Keep the title under 10 words.
- Use the provided segments to accurately find the start and end times where the highlight is discussed.
- Make the 'start' the beginning of the relevant context (a few seconds before they make the decision), and 'end' when the discussion of that point wraps up.
- DO NOT include any markdown code blocks outside the JSON object. Just return RAW JSON.`;

  const completion = await client.chat.completions.create({
    model: NIM_MODELS[model as keyof typeof NIM_MODELS] || NIM_MODELS["gpt-oss-120b"],
    messages: [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `Transcript:\n\n${transcriptText}\n\nSegments (for timing reference):\n${JSON.stringify(segments.map(s => ({ start: s.start, end: s.end, text: s.text })))}` 
      }
    ],
    temperature: 0.1, // extremely precise extraction
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No response from highlights model");
  
  try {
    const cleaned = cleanJson(content);
    const parsed = JSON.parse(cleaned);
    return parsed.highlights || [];
  } catch (err) {
    console.error("JSON Parse Error when generating highlights:", err, "Raw Content:", content);
    throw new Error("Failed to parse highlights response as JSON");
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    flac: "audio/flac",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "audio/webm",
  };
  return types[ext ?? ""] ?? "audio/mpeg";
}
