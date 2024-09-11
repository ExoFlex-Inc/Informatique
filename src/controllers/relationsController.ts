import { Request, Response } from "express";
import supaClient from "../utils/supabaseClient.ts";

const fetchRelation = async (req: Request, res: Response) => {
  const user_id = req.params.userId;

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, message: "No user_id provided" });
  }

  try {
    const { data, error } = await supaClient
      .from("relations")
      .select("*")
      .eq("client_id", user_id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch relations",
        error: error.message,
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching relations",
      error: error.message,
    });
  }
};

const postRelation = async (req: Request, res: Response) => {
  const { user_id, admin_id } = req.body;

  if (!user_id && !admin_id) {
    return res
      .status(400)
      .json({ success: false, message: "Profile or selected admin missing" });
  }

  try {
    const { error } = await supaClient.from("relations").insert({
      admin_id: admin_id,
      client_id: user_id,
      relation_status: "pending",
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to send request",
        error: error.message,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Request sent successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error sending request",
      error: error.message,
    });
  }
};

const removeRelation = async (req: Request, res: Response) => {
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
      error: error.message,
    });
  }
};

const acceptRequest = async (req: Request, res: Response) => {
  const { relationId } = req.params;

  if (!relationId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid relation" });
  }

  try {
    const { error } = await supaClient
      .from("relations")
      .update({ relation_status: "accepted" })
      .eq("id", relationId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to accept the relation",
        error: error.message,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Request accepted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error accepting relation",
      error: error.message,
    });
  }
};

export { removeRelation, fetchRelation, postRelation, acceptRequest };
