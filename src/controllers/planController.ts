// src/controllers/planController.ts
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import supaClient from "../utils/supabaseClient"; // Adjust the path as necessary
import { PostPlanRequestBody } from "../interfaces/Plan";

const postPlan = asyncHandler(async (req: Request, res: Response) => {
  // Type assertion for request body
  const { plan, user_id }: PostPlanRequestBody = req.body;

  // Input Validation
  if (!plan || !user_id) {
    return res.status(400).json({ message: "Plan and user_id are required." });
  }


  try {
    // Insert the plan into the 'plans' table
    const { data, error } = await supaClient
      .from("plans") // Replace with your actual table name
      .insert([
        {
          user_id,
          plan, 
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error sending plan:", error);
      return res.status(500).json({ message: "Error sending plan", error: error.message });
    }

    console.log("Success sending plan:", data);
    return res.status(200).json({ message: "Success sending plan", data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Unexpected error occurred." });
  }
});

const getPlan = asyncHandler(async (req: Request, res: Response) => {
  const user_id = req.params.userId;

  const { data, error } = await supaClient.rpc("get_planning", {
    search_id: user_id,
  });

  if (error) {
    console.error(`Error getting current plan:`, error);
    res.status(500).json({ error: "Error getting current plan" });
  } else {
    console.log(`Success getting current plan:`, data);
    res.status(200).json(data);
  }
});

export { postPlan, getPlan };
