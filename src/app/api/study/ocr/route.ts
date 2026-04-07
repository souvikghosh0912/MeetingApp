import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { performOCR } from "@/lib/nvidia-nim";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    // Max 10 MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Image exceeds 10 MB limit." }, { status: 400 });
    }

    // Convert to base64 for NIM vision model
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageBase64 = buffer.toString("base64");

    const extractedText = await performOCR(imageBase64, file.type);

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from the image. Please try a clearer image." },
        { status: 422 }
      );
    }

    return NextResponse.json({ extractedText });
  } catch (err) {
    console.error("[study/ocr] error:", err);
    const message = err instanceof Error ? err.message : "OCR failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
