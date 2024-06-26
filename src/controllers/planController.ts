import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { supaClient } from "../hooks/supa-client.ts";

const postPlan = asyncHandler(async (req: Request, res: Response) => {
  const { plan } = req.body;
  const user = req.user;

  const { data, error } = await supaClient.rpc("post_planning", {
    user_id: user?.id,
    new_plan: plan,
  });

  if (error) {
    console.error(`Error sending plan:`, error);
    res.status(500).send("Error sending plan");
  } else {
    console.log(`Success sending plan:`, data);
    res.status(200).send("Success sending plan");
  }
});

const getPlan = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  const { data, error } = await supaClient.rpc("get_planning", {
    search_id: user?.id,
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
