import supaClient from "../utils/supabaseClient.ts";

import type { Request, Response } from "express";

export const getNotifications = async (req: Request, res: Response) => {
  const userId = req.params["userId"];

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Fetch notifications from the database filtered by userId
    const { data: userNotifications, error: notifFetchError } = await supaClient
      .from("notifications")
      .select("*")
      .eq("receiver_id", userId);

    if (notifFetchError) {
      return res.status(500).json({
        message: "Error fetching notifications",
        error: notifFetchError,
      });
    }

    return res.json(userNotifications);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  const { sender_id, receiver_id, user_name, type, message, image_url } =
    req.body;

  if (!sender_id || !receiver_id || !user_name || !type || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const { data: imageUrl } = supaClient.storage
      .from("avatars")
      .getPublicUrl(image_url);

    const { data: newNotification, error: notifInsertError } = await supaClient
      .from("notifications")
      .insert([
        {
          sender_id: sender_id,
          receiver_id: receiver_id,
          user_name: user_name,
          image: imageUrl.publicUrl,
          type: type,
          body: message,
          created_at: new Date(),
        },
      ])
      .single();

    if (notifInsertError) {
      console.error("Error inserting notification:", notifInsertError.message);
      return res.status(500).json({
        message: "Failed to create notification",
        error: notifInsertError.message,
      });
    }

    return res.status(201).json(newNotification);
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({
        message: "Internal server error",
        error: (error as Error).message,
      });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  const notificationId = req.params["notificationId"];

  if (!notificationId) {
    return res.status(400).json({ message: "Notification ID is required" });
  }

  try {
    const { data: deletedNotification, error: deleteError } = await supaClient
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (deleteError) {
      return res
        .status(500)
        .json({ message: "Error deleting notification", error: deleteError });
    }

    return res.status(200).json({
      message: "Notification deleted successfully",
      deletedNotification,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Internal server error",
        error: (error as Error).message,
      });
  }
};
