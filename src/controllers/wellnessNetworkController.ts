import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { supaClient } from "../hooks/supa-client.ts";

const getAdminClientsList = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      data: { user },
      error: authError,
    } = await supaClient.auth.getUser();

    if (authError) {
      console.error("Error getting user:", authError);
      return res.status(500).json({ error: "Error getting user" });
    }

    if (!user?.id) {
      console.error("User is not authenticated or user ID is missing");
      return res.status(401).json({ error: "User is not authenticated" });
    }

    const { data, error } = await supaClient.rpc("get_clients_for_admin", {
      admin_id: user.id,
    });

    if (error) {
      console.error(`Error getting clients:`, error);
      res.status(500).json({ error: "Error getting clients" });
    }

    console.log(`Success getting clients:`, data);
    res.status(200).json(data);
  },
);

export { getAdminClientsList };
