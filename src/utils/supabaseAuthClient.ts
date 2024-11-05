import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_API_URL"] as string;
const supabaseServiceRoleKey = process.env[
  "SUPABASE_SERVICE_ROLE_KEY"
] as string;

const supaAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

export default supaAdminClient;
