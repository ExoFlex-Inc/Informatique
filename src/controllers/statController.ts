import type { Request, Response } from "express";
import supaClient from "../utils/supabaseClient.ts";

export const fetchStats = async (req: Request, res: Response) => {
    const user_id = req.params["userId"];
  
    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "No user_id provided" });
    }
  
    try {
      const { data: stats, error: statsError } = await supaClient
        .from("stats")
        .select("*")
        .eq("user_id", user_id);
  
      if (statsError) {
        console.error("Failed to fetch stats:", statsError);
        return res.status(500).json({
          message: "Failed to fetch stats",
          error: statsError.message,
        });
      }
  
      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      return res
        .status(500)
        .json({ message: "Error fetching stats", error: (error as any).message });
    }
  };

  export const fetchTopUsersStats = async (req: Request, res: Response) => {

    const {limit} = req.query;
  
    try {
      const { data: stats, error: statsError } = await supaClient
        .from("stats")
        .select("*")
        .limit(limit || undefined);
  
      if (statsError) {
        console.error("Failed to fetch stats:", statsError);
        return res.status(500).json({
          message: "Failed to fetch stats",
          error: statsError.message,
        });
      }

      const userIds = stats.map(stat => stat.user_id);
      const { data: users, error: usersError } = await supaClient
        .from("user_profiles")
        .select("*")
        .in("user_id", userIds);

      if (usersError) {
        console.error("Failed to fetch users:", usersError);
        return res.status(500).json({
          message: "Failed to fetch users",
          error: usersError.message,
        });
      }

      const usersWithStatData = users.map(user => ({
        ...user,
        stats: stats.find(stat => stat.user_id === user.user_id),  // Match stat with the user
      }));  
  
      return res.status(200).json(usersWithStatData);
    } catch (error) {
      console.error("Error fetching stats:", error);
      return res
        .status(500)
        .json({ message: "Error fetching stats", error: (error as any).message });
    }
  };
