import type { Request, Response } from "express";
import supaClient from "../utils/supabaseClient.ts";

export const postPlan = async (req: Request, res: Response) => {
  const { plan, user_id } = req.body;

  if (!plan || !user_id) {
    return res.status(400).json({ message: "Plan and user_id are required." });
  }

  try {
    const { data: existingPlan, error: fetchError } = await supaClient
      .from("plans")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (fetchError) {
      console.error("Error fetching existing plan:", fetchError);
      return res.status(500).json({
        message: "Error fetching existing plan",
        error: fetchError.message,
      });
    }

    if (existingPlan) {
      const { error: deleteError } = await supaClient
        .from("plans")
        .delete()
        .eq("user_id", user_id);

      if (deleteError) {
        console.error("Error deleting existing plan:", deleteError);
        return res.status(500).json({
          message: "Error deleting existing plan",
          error: deleteError.message,
        });
      }
      console.log(`Existing plan for user ${user_id} deleted.`);
    }

    const { data, error } = await supaClient
      .from("plans")
      .insert([
        {
          user_id,
          plan,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting new plan:", error);
      return res
        .status(500)
        .json({ message: "Error inserting new plan", error: error.message });
    }

    console.log("Success sending new plan:", data);
    return res.status(200).json({ message: "Success sending new plan", data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Unexpected error occurred." });
  }
};

export const getPlan = async (req: Request, res: Response) => {
  const user_id = req.params["userId"];

  // Input Validation
  if (!user_id) {
    return res
      .status(400)
      .json({ message: "User ID is required.", data: null });
  }

  try {
    const { data, error } = await supaClient
      .from("plans")
      .select("*")
      .eq("user_id", user_id)
      .single();

    // Handle error scenarios
    if (error) {
      // Check if the error code is PGRST116 or any other relevant code indicating a "Not Found" error
      if (error.code === "PGRST116") {
        console.warn(`Plan not found for user_id: ${user_id}`);
        return res
          .status(404)
          .json({ message: "No plan found for this user.", data: null });
      }

      console.error("Error getting plan:", error);
      return res
        .status(500)
        .json({ message: "Error getting plan", error: error.message });
    }

    return res.status(200).json({ plan: data.plan });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Unexpected error occurred." });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  const { plan, user_id } = req.body;

  // Validate the input
  if (!plan || !user_id) {
    return res.status(400).json({ message: "Plan and user_id are required." });
  }

  try {
    // Check if the plan exists for the given user_id
    const { data: existingPlan, error: fetchError } = await supaClient
      .from("plans")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (fetchError) {
      // Handle "not found" case gracefully
      if (fetchError.code === "PGRST116") {
        console.warn(`No plan found for user_id: ${user_id}`);
        return res
          .status(404)
          .json({ message: "No existing plan found to update." });
      }

      console.error("Error fetching existing plan:", fetchError);
      return res.status(500).json({
        message: "Error fetching existing plan",
        error: fetchError.message,
      });
    }

    // Update the existing plan
    const { data, error } = await supaClient
      .from("plans")
      .update({
        plan
      })
      .eq("user_id", user_id)
      .select("*");

    if (error) {
      console.error("Error updating plan:", error);
      return res
        .status(500)
        .json({ message: "Error updating plan", error: error.message });
    }

    console.log(`Plan updated successfully for user_id: ${user_id}`);
    return res
      .status(200)
      .json({ message: "Plan updated successfully.", data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Unexpected error occurred." });
  }
};
