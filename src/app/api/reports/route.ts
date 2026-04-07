import { createClient } from "@supabase/supabase-js";
import { logAuditFromRequest } from "@/lib/audit-logger";
import { NextRequest, NextResponse } from "next/server";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getClient();
  try {
    let user = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    }

    const { report_type, item_id, reason, description, reporter_email } = await request.json();

    if (!report_type || !item_id || !reason) {
      return NextResponse.json({ error: "Missing required fields: report_type, item_id, reason" }, { status: 400 });
    }

    if (!user && !reporter_email) {
      return NextResponse.json({ error: "Please provide an email address for anonymous reports" }, { status: 400 });
    }

    const validReportTypes = ["comment","share","page","database","transcript","user"];
    const validReasons = ["inappropriate","spam","harassment","copyright","private_data","other"];

    if (!validReportTypes.includes(report_type)) {
      return NextResponse.json({ error: `Invalid report_type. Must be one of: ${validReportTypes.join(", ")}` }, { status: 400 });
    }
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: `Invalid reason. Must be one of: ${validReasons.join(", ")}` }, { status: 400 });
    }

    let query = supabase
      .from("admin_reports")
      .select("id")
      .eq("item_id", item_id)
      .eq("report_type", report_type)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (user) {
      query = query.eq("reported_by_id", user.id);
    } else {
      query = query.like("description", `%${reporter_email}%`);
    }

    const { data: existingReports } = await query;
    if (existingReports && existingReports.length > 0) {
      return NextResponse.json({ error: "You have already reported this item in the last 24 hours" }, { status: 409 });
    }

    // eslint-disable-next-line
    const reportData: any = {
      reported_by_id: user?.id || null,
      report_type,
      item_id,
      reason,
      description: description || (reporter_email ? `Reporter email: ${reporter_email}` : null),
      status: "pending",
    };

    const { data: newReport, error: reportError } = await supabase
      .from("admin_reports")
      .insert(reportData)
      .select()
      .single();

    if (reportError) {
      console.error("Error creating report:", reportError);
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
    }

    if (user) {
      await logAuditFromRequest(
        { user_id: user.id, action: "report_submitted", entity_type: "report", entity_id: newReport.id, changes: { report_type, item_id, reason } },
        request,
        // eslint-disable-next-line
        supabase as any
      );
    }

    return NextResponse.json({ success: true, report_id: newReport.id, message: "Report submitted successfully. Thank you for helping keep our community safe." }, { status: 201 });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = getClient();
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data: reports, error } = await supabase
      .from("admin_reports")
      .select(`*, reported_by:reported_by_id(id, display_name, avatar_url), resolved_by:resolved_by_id(id, display_name, avatar_url)`)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
