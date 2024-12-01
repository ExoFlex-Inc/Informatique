import { useQuery, useQueryClient } from "@tanstack/react-query";
import { messaging, onForegroundMessage } from "../utils/firebaseClient.ts";
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
    queryKey: ["notification"],
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
    staleTime: 0,
    enabled: !!user?.user_id,
  });

  // Listen for live FCM notifications and update cache directly
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchMessage = async () => {
      const payload = await onForegroundMessage();
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

      queryClient.setQueryData(["notification"], (old = []) => [
        newNotification,
        ...old,
      ]);
    };

    fetchMessage();
  }, [queryClient, user?.user_id]);

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`http://localhost:3001/notification/${notificationId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      queryClient.setQueryData(["notification"], (old = []) =>
        old.filter((notif) => notif.id !== notificationId),
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return { notifications, isLoading, error, deleteNotification };
}
