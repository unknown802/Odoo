import type { Request } from "express";
import { getSupabaseAdminClient } from "../config/supabase.js";
import type { AuthenticatedRequest } from "../types/index.js";

export async function logActivity(
  req: Request,
  action: string,
  entity_type: string,
  entity_id?: string | null,
  details: Record<string, unknown> = {}
) {
  const supabase = getSupabaseAdminClient();
  const user = (req as AuthenticatedRequest).user;

  await supabase.from("activity_logs").insert({
    user_id: user?.id,
    action,
    entity_type,
    entity_id,
    details,
    ip_address: req.ip
  });
}
