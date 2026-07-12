import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useRealtimeNotifications(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;

    const channel = client
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [queryClient, userId]);
}
