import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { supaClient } from "../hooks/supa-client.ts";

const authenticateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { data: { user } } = await supaClient.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  req.user = user;
  next();
});

export { authenticateUser };
