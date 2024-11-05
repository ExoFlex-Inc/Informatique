import supaClient from "../utils/supabaseClient.ts";
import type { Request, Response } from "express";

export const getExerciseData = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { start_date, end_date } = req.query;

  if (!userId || !start_date || !end_date) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const { data, error } = await supaClient
      .from("exercise_data")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", start_date)
      .lte("created_at", end_date)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: (error as any).message });
  }
};

export const getExerciseDataById = async (req: Request, res: Response) => {
  const { exerciseId } = req.params;

  if (!exerciseId) {
    return res
      .status(400)
      .json({ message: "Missing required parameter: exerciseId" });
  }

  try {
    const { data, error } = await supaClient
      .from("exercise_data")
      .select("*")
      .eq("id", exerciseId)
      .single();

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    if (!data) {
      return res.status(404).json({ message: "Exercise data not found" });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: (error as any).message });
  }
};

export const postExerciseData = async (req: Request, res: Response) => {
  const { user_id, rated_pain } = req.body;

  // Insert exercise data
  const { error: exerciseError } = await supaClient.from("exercise_data").insert({
    rated_pain,
    user_id,
  });

  if (exerciseError) {
    return res.status(500).json({
      message: "Failed to send exercise data",
      error: exerciseError.message,
    });
  }

  // Fetch the user's stats including 'updated_at'
  const { data: statsData, error: fetchError } = await supaClient
    .from("stats")
    .select("current_streak, longest_streak, updated_at")
    .eq("user_id", user_id)
    .single();

  if (fetchError) {
    return res.status(500).json({
      message: "Failed to retrieve current streak",
      error: fetchError.message,
    });
  }

  let newCurrentStreak = 1; // Default streak

  if (statsData) {
    // Convert dates to local date strings (e.g., "2023-10-05")
    const lastUpdatedDate = new Date(statsData.updated_at).toLocaleDateString();
    const currentDate = new Date().toLocaleDateString();

    if (lastUpdatedDate !== currentDate) {
      // Dates are different, calculate the difference in days
      const lastUpdated = new Date(statsData.updated_at);
      const now = new Date();

      // Set time to midnight for accurate date comparison
      lastUpdated.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);

      const diffInDays = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

      if (diffInDays === 1) {
        // Exactly one day has passed, increment the streak
        newCurrentStreak = statsData.current_streak + 1;
      } else {
        // More than one day has passed, reset the streak
        newCurrentStreak = 1;
      }

      // Prepare updates
      const updates: any = { current_streak: newCurrentStreak };

      // Update longest_streak if necessary
      if (newCurrentStreak > statsData.longest_streak) {
        updates.longest_streak = newCurrentStreak;
      }

      // Update the stats
      const { error: updateError } = await supaClient
        .from("stats")
        .update(updates)
        .eq("user_id", user_id);

      if (updateError) {
        return res.status(500).json({
          message: "Failed to update stats",
          error: updateError.message,
        });
      }
    } else {
      // Same day, do not increment the streak
      newCurrentStreak = statsData.current_streak;
    }
  } else {
    // Create a new stats entry if none exists
    const { error: insertError } = await supaClient.from("stats").insert({
      user_id,
      current_streak: newCurrentStreak,
      longest_streak: newCurrentStreak,
    });

    if (insertError) {
      return res.status(500).json({
        message: "Failed to create stats entry",
        error: insertError.message,
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: "Exercise data sent successfully",
  });
};