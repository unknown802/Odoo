import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAssetFlowStore } from "../store/assetFlowStore";
import type { NotificationItem } from "../types";

export function useNotifications(userId: string) {
  const demoNotifications = useAssetFlowStore((state) => state.notifications);

  return useQuery({
    queryKey: ["notifications", userId, demoNotifications],
    queryFn: async () => {
      if (!supabase) {
        return demoNotifications.filter((notification) => notification.user_id === userId);
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .returns<NotificationItem[]>();
      if (error) throw error;
      return data;
    }
  });
}
