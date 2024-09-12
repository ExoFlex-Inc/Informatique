import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supaAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

export default supaAdminClient;
