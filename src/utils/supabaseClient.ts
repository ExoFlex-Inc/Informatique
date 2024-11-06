import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_API_URL"] as string;
const supabaseKey = process.env["SUPABASE_ANON_KEY"] as string;

const supaClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export default supaClient;
