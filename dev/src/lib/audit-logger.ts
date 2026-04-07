/**
 * Audit Logging Utility
 * Centralized audit logging for compliance tracking
 */

import { createClient } from "@supabase/supabase-js";

export type AuditAction =
  | "user_login"
  | "user_logout"
  | "user_signup"
  | "user_profile_update"
  | "transcript_upload"
  | "transcript_delete"
  | "page_create"
  | "page_update"
  | "page_delete"
  | "comment_create"
  | "comment_delete"
  | "share_create"
  | "share_delete"
  | "database_create"
  | "database_delete"
  | "report_submitted"
  | "report_reviewed"
  | "content_removed"
  | "user_suspended"
  | "export_generated";

export type EntityType = "user" | "transcript" | "page" | "database" | "comment" | "share" | "report" | "other";

export interface AuditLogEntry {
  user_id?: string;
  admin_id?: string;
  action: AuditAction;
  entity_type: EntityType;
  entity_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit event for compliance tracking
 */
export async function logAudit(
  entry: AuditLogEntry,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseClient.from("audit_logs").insert([
      {
        ...entry,
        created_at: new Date().toISOString(),
      },
    // eslint-disable-next-line
    ] as any);

    if (error) {
      console.error("Audit log error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to log audit event:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Log audit from API route (server-side)
 * Captures IP and user agent automatically
 */
export async function logAuditFromRequest(
  entry: AuditLogEntry,
  request?: Request,
  supabaseClient?: ReturnType<typeof createClient>
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = supabaseClient || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (request) {
      userAgent = request.headers.get("user-agent") || undefined;
      ipAddress = (
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        request.headers.get("cf-connecting-ip") ||
        "unknown"
      ) as string;
    }

    const { error } = await client.from("audit_logs").insert([
      {
        ...entry,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      },
    // eslint-disable-next-line
    ] as any);

    if (error) {
      console.error("Audit log error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to log audit event:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Helper: Get audit logs for a specific entity
 */
export async function getAuditLogsForEntity(
  entityType: EntityType,
  entityId: string,
  supabaseClient: ReturnType<typeof createClient>
) {
  try {
    const { data, error } = await supabaseClient
      .from("audit_logs")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to fetch audit logs:", err);
    return [];
  }
}

/**
 * Helper: Get audit logs for a user (compliance/activity report)
 */
export async function getUserAuditLogs(
  userId: string,
  supabaseClient: ReturnType<typeof createClient>,
  limit: number = 100
) {
  try {
    const { data, error } = await supabaseClient
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to fetch user audit logs:", err);
    return [];
  }
}
