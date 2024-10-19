import { useQuery, useQueryClient } from "@tanstack/react-query";
import { messaging, onMessage } from "../utils/firebaseClient.ts";
import { useEffect } from "react";
import { useUser } from "./use-user.ts";

export function useNotification() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Fetch notifications from the server
  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notification", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return [];
      const response = await fetch(
        `http://localhost:3001/notification/${user.user_id}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Error fetching notification");
      return await response.json();
    },
    enabled: !!user?.user_id,
  });

  // Listen for live FCM notifications and update cache directly
  useEffect(() => {
    if (!user?.user_id) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const { title, body, image } = payload.notification;
      const { id, type, sender_id, user_name } = payload.data;

      const newNotification = {
        id,
        title,
        body,
        image,
        type,
        user_name,
        sender_id,
        created_at: new Date(),
      };

      // Update the cache directly
      queryClient.setQueryData(
        ["notification", user.user_id],
        (old = []) => [newNotification, ...old],
      );
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, user?.user_id]);

  return { notifications, isLoading, error };
}
