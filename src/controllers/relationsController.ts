import type { Request, Response } from "express";
import supaClient from "../utils/supabaseClient.ts";

export const fetchRelation = async (req: Request, res: Response) => {
  const user_id = req.params["userId"];

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, message: "No user_id provided" });
  }

  try {
    const { data: relations, error: relationsError } = await supaClient
      .from("relations")
      .select("admin_id, client_id")
      .or(`admin_id.eq.${user_id},client_id.eq.${user_id}`);

    if (relationsError) {
      console.error("Failed to fetch relations:", relationsError);
      return res.status(500).json({
        message: "Failed to fetch relations",
        error: relationsError.message,
      });
    }

    if (!relations || relations.length === 0) {
      console.log("No relations found for this user");
      return res.status(200).json([]);
    }

    const relationsIds = relations.map((relation) =>
      relation.admin_id === user_id ? relation.client_id : relation.admin_id,
    );

    const { data: userProfiles, error: profilesError } = await supaClient
      .from("user_profiles")
      .select("user_id, first_name, last_name, phone_number, email")
      .in("user_id", relationsIds);

    if (profilesError) {
      console.error("Error getting user profiles:", profilesError);
      return res.status(500).json({ error: "Error getting user profiles" });
    }

    return res.status(200).json(userProfiles);
  } catch (error) {
    console.error("Error fetching relations:", error);
    return res.status(500).json({
      message: "Error fetching relations",
      error: (error as any).message,
    });
  }
};

export const postRelation = async (req: Request, res: Response) => {
  const { client_id, admin_id } = req.body;

  // Validate input
  if (!client_id || !admin_id) {
    return res.status(400).json({
      success: false,
      message: "Client or admin id missing",
    });
  }

  try {
    const { error } = await supaClient.from("relations").insert({
      client_id: client_id,
      admin_id: admin_id,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create relation",
        error: error.message,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Relation request sent successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating relation",
      error: (error as any).message,
    });
  }
};

export const removeRelation = async (req: Request, res: Response) => {
  const { relationId } = req.params;

  if (!relationId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid relation" });
  }

  try {
    const { error } = await supaClient
      .from("relations")
      .delete()
      .eq("id", relationId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to refuse the relation",
        error: error.message,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Request removed successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error refusing relation",
      error: (error as any).message,
    });
  }
};

export const getPendingAdminNotifications = async (
  req: Request,
  res: Response,
) => {
  const userId = req.params["userId"];

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Fetch notifications from the database filtered by userId
    const { data: userNotifications, error: notifFetchError } = await supaClient
      .from("notifications")
      .select("*")
      .eq("type", "relation")
      .eq("sender_id", userId);

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
