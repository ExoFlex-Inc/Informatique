import supaClient from "../utils/supabaseClient.ts";

export const getExerciseData = async (req, res) => {
  const { userId } = req.params;  // Extract userId from URL parameter
  const { start_date, end_date } = req.query;  // Extract start_date and end_date from query parameters

  if (!userId || !start_date || !end_date) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    const { data, error } = await supaClient
      .from('exercise_data')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start_date)
      .lte('date', end_date);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};