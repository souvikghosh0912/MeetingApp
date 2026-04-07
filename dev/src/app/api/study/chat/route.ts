import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
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

    const { messages, documentId, modelId } = await req.json();

    if (!documentId || !messages) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // Fetch study page
    const { data: studyPage, error: fetchError } = await supabase
      .from("study_pages")
      .select("extracted_text")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !studyPage || !studyPage.extracted_text) {
      return new NextResponse("Study page not found or empty", { status: 404 });
    }

    // Map 8b / 20b toggle directly to constants
    let modelName: string = NIM_MODELS["llama-8b"];
    if (modelId === "20b") {
      modelName = NIM_MODELS["gpt-oss-20b"];
    }

    const systemPromptBase = "You are a helpful AI tutor and study assistant answering questions based strictly on the provided document text.";

    const fullSystemPrompt = `${systemPromptBase}\n\n--- DOCUMENT TEXT CONTEXT ---\n${studyPage.extracted_text}\n----------------------------------\n`;

    const mappedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    // 1. DBPersist: Save the new user message (the last one in the array)
    const latestUserMsg = mappedMessages[mappedMessages.length - 1];
    if (latestUserMsg && latestUserMsg.role === "user") {
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        document_id: documentId,
        document_type: "study",
        role: "user",
        content: latestUserMsg.content
      });
    }

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
        let fullAssistantText = "";

        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            fullAssistantText += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();

        // 2. DBPersist: Save the assistant's response once completed
        if (fullAssistantText) {
          try {
            await supabase.from("chat_messages").insert({
              user_id: user.id,
              document_id: documentId,
              document_type: "study",
              role: "assistant",
              content: fullAssistantText
            });
          } catch (err) {
            console.error("[DB Save Error After Stream]", err);
          }
        }
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
    console.error("[study chat api error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
