import { getSupabaseAdminClient } from "../config/supabase.js";
import type { NotificationPayload } from "../types/index.js";

export const notificationService = {
  async create(payload: NotificationPayload) {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("notifications").insert({
      ...payload,
      data: payload.data ?? {}
    });

    if (error) {
      throw new Error(`Notification error: ${error.message}`);
    }
  },

  async broadcast(userIds: string[], payload: Omit<NotificationPayload, "user_id">) {
    if (userIds.length === 0) {
      return;
    }

    const supabase = getSupabaseAdminClient();
    const inserts = userIds.map((user_id) => ({
      ...payload,
      user_id,
      data: payload.data ?? {}
    }));

    const { error } = await supabase.from("notifications").insert(inserts);

    if (error) {
      throw new Error(`Notification broadcast error: ${error.message}`);
    }
  }
};
