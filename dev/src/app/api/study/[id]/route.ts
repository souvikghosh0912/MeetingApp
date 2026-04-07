import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: studyPage, error } = await supabase
      .from("study_pages")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !studyPage) {
      return NextResponse.json({ error: "Study page not found" }, { status: 404 });
    }

    return NextResponse.json({ studyPage });
  } catch (err) {
    console.error("[study/[id]] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch study page" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch to get the image path before deleting
    const { data: studyPage } = await supabase
      .from("study_pages")
      .select("source_image_path")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase
      .from("study_pages")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clean up storage if there's an associated image
    if (studyPage?.source_image_path) {
      await supabase.storage
        .from("study-images")
        .remove([studyPage.source_image_path]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[study/[id]] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete study page" }, { status: 500 });
  }
}
