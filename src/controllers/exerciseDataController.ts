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
