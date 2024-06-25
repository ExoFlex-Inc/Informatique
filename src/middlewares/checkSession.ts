import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { supaClient } from "../hooks/supa-client.ts";

const checkSession = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { data } = await supaClient.auth.getSession();

    const access_token = data.session?.access_token;
    const refresh_token = data.session?.refresh_token;

    if (!access_token || !refresh_token) {
      console.error("Session lost");
      res.status(401).json({ error: "Session lost" });
    } else {
      next();
    }
  },
);

export { checkSession };
