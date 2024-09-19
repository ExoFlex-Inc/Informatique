import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserProfile } from "./use-profile.ts";
import { messaging, onMessage } from "../utils/firebaseClient.ts";
import { useEffect } from "react";

export function useNotification() {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();

  // Fetch notifications from the server
  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notification", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      const response = await fetch(
        `http://localhost:3001/notification/${profile.user_id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Error fetching notification");
      return await response.json();
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    enabled: !!profile?.user_id,
  });

  // Listen for live FCM notifications and update cache directly
  useEffect(() => {
    if (!profile?.user_id) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const { title, body, image } = payload.notification;
      const { id, type, user_id, user_name } = payload.data;

      const newNotification = {
        id,
        title,
        body,
        image,
        type,
        user_name,
        user_id,
        created_at: new Date(),
      };

      // Update the cache directly
      queryClient.setQueryData(
        ["notification", profile.user_id],
        (old = []) => [newNotification, ...old]
      );
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, profile?.user_id]);

  return { notifications, isLoading, error };
}