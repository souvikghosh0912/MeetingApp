import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.from("chat_messages").select("id").limit(1);

  if (error) {
    return NextResponse.json({ success: false, error });
  }

  return NextResponse.json({ success: true, count: data.length });
}
