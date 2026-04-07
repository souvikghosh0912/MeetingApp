import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { NIM_BASE_URL, NIM_MODELS } from "@/lib/constants";

export const maxDuration = 60;

const openai = new OpenAI({
  baseURL: NIM_BASE_URL,
  apiKey: process.env.NVIDIA_NIM_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { selectedText, documentContext } = await req.json() as {
      selectedText: string;
      documentContext?: string;
    };

    if (!selectedText?.trim()) {
      return new NextResponse("Missing selectedText", { status: 400 });
    }

    const contextBlock = documentContext
      ? `\n\nFor additional context, here is the broader document the selection came from:\n---\n${documentContext.slice(0, 3000)}\n---`
      : "";

    const systemPrompt = `You are a brilliant study tutor. When given a piece of text a student has highlighted, explain it clearly and concisely.

Rules:
- Use plain, simple language. Explain as if to a curious student.
- Be concrete — if a term is technical, define it in 1 sentence.
- Keep your response to 2–4 short sentences or bullet points maximum.
- Do NOT start with "Sure", "Certainly", "Of course" or similar filler phrases.
- Go straight into the explanation.${contextBlock}`;

    const stream = new ReadableStream({
      async start(controller) {
        const response = await openai.chat.completions.create({
          model: NIM_MODELS["llama-8b"],
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Explain this:\n\n"${selectedText}"` },
          ],
          temperature: 0.4,
          max_tokens: 256,
          stream: true,
        });

        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[study/explain] error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
