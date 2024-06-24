import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { supaClient } from "../hooks/supa-client.ts";

const setupLocalServer = asyncHandler(async (req: Request, res: Response) => {
  const { access_token, refresh_token } = req.body;

  const {
    data: { session },
  } = await supaClient.auth.setSession({
    access_token,
    refresh_token,
  });

  if (session) {
    console.log("Local server setup successful.");
    res.status(200).send("Local server setup successful.");
  } else {
    res.status(401).json({ error: "Session not established" });
  }
});

export { setupLocalServer };
