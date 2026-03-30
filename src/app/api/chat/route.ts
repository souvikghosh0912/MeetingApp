import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";
import { NIM_BASE_URL, NIM_MODELS } from "@/lib/constants";

export const maxDuration = 120; // Allow 2 minutes for long streaming

const openai = new OpenAI({
  baseURL: NIM_BASE_URL,
  apiKey: process.env.NVIDIA_NIM_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { messages, transcriptId, modelId } = await req.json();

    if (!transcriptId || !messages) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // Fetch transcript
    const { data: transcript, error: fetchError } = await supabase
      .from("transcripts")
      .select("transcript_text")
      .eq("id", transcriptId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !transcript || !transcript.transcript_text) {
      return new NextResponse("Transcript not found or empty", { status: 404 });
    }

    // Map 8b / 20b toggle directly to constants
    let modelName: string = NIM_MODELS["llama-8b"];
    if (modelId === "20b") {
      modelName = NIM_MODELS["gpt-oss-20b"];
    }

    // Load system prompt
    const systemPromptPath = path.join(process.cwd(), "system_prompt.txt");
    let systemPromptBase = "";
    try {
      systemPromptBase = await fs.readFile(systemPromptPath, "utf-8");
    } catch (e) {
      console.warn("Could not load system_prompt.txt, using fallback.");
      systemPromptBase = "You are a helpful AI assistant answering questions about the provided meeting transcript.";
    }

    const fullSystemPrompt = `${systemPromptBase}\n\n--- MEETING TRANSCRIPT CURRENT CONTEXT ---\n${transcript.transcript_text}\n----------------------------------\n`;

    const mappedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: fullSystemPrompt },
        ...mappedMessages,
      ],
      temperature: 0.2, // low temp for factual QA extraction
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error("[chat api error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
