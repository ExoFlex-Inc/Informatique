import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { supaClient } from "../hooks/supa-client.ts";

const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { data: { user } } = await supaClient.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ error: "User not authenticated" });
  }
  
  res.json({ user });
});

export { getUser };
