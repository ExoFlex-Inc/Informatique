import supaClient from "../utils/supabaseClient.ts";

export const getExerciseData = async (req, res) => {
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
    return res.status(500).json({ message: error.message });
  }
};

export const getExerciseDataById = async (req, res) => {
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
    return res.status(500).json({ message: error.message });
  }
};

export const postExerciseData = async (req, res) => {
  const { user_id, rated_pain, stats } = req.body;

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

  // Check if the user already has a stats entry
  const { data: statsData, error: fetchError } = await supaClient
    .from("stats")
    .select("current_streak")
    .eq("user_id", user_id)
    .single();

  if (fetchError) {
    return res.status(500).json({
      message: "Failed to retrieve current streak",
      error: fetchError.message,
    });
  }

  // If stats entry exists, update current_streak
  if (statsData) {
    const { error: updateError } = await supaClient
      .from("stats")
      .update({ current_streak: statsData.current_streak + 1 })
      .eq("user_id", user_id);

    if (updateError) {
      return res.status(500).json({
        message: "Failed to update current streak",
        error: updateError.message,
      });
    }
  } else {
    // If no stats entry exists, create a new one
    const { error: insertError } = await supaClient.from("stats").insert({
      current_streak: stats.current_streak + 1,
      user_id,
    });

    if (insertError) {
      return res.status(500).json({
        message: "Failed to create stats entry",
        error: insertError.message,
      });
    }
  }

  if(stats.longest_streak < stats.current_streak) {
    const { error: updateError } = await supaClient
      .from("stats")
      .update({ longest_streak: stats.current_streak+1 })
      .eq("user_id", user_id);

    if (updateError) {
      return res.status(500).json({
        message: "Failed to update longest streak",
        error: updateError.message,
      });
    }
  }

  return res.status(200).json({ success: true, message: "Exercise data sent successfully" });
};
