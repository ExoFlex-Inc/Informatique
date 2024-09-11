import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_API_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supaClient = createClient(supabaseUrl, supabaseKey);

// Export the client to be used throughout the app
export const supaAuthClient = supaClient.auth.admin;
export default supaClient;
