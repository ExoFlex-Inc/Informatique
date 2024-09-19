import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import supaClient from "../utils/supabaseClient.ts";

const getUsersList = asyncHandler(
  async (req: Request, res: Response) => {
    const {search} = req.query;
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

    const {data: dataRelations, error: errorRelations} = await supaClient
      .from("relations")
      .select(`
        admin_id,
        client_id
      `)
      .or(`admin_id.eq.${user.id},client_id.eq.${user.id}`);

    if (errorRelations) {
      console.error(`Error getting clients:`, errorRelations);
      res.status(500).json({ error: "Error getting clients" });
    }

    if (!dataRelations || dataRelations.length == 0) {
      console.log("No relations found for this user");
      return res.status(404).json({ message: "No relations found" });
    }

    const relationsIds = dataRelations.map((relation) => 
      relation.admin_id === user.id ? relation.client_id : relation.admin_id
    );

    const { data: userProfiles, error: profilesError} = await supaClient
      .from("user_profiles")
      .select("user_id, first_name, last_name, phone_number, email")
      .in("user_id", relationsIds)

    if (profilesError) {
      console.error(`Error getting user profiles:`, profilesError);
      return res.status(500).json({ error: "Error getting user profiles" });
    }

    console.log(`Success getting clients:`, userProfiles);
    res.status(200).json(userProfiles);
  },
);

export { getUsersList };
