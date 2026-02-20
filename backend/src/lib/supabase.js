import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client used on the BACKEND ONLY.
 * Uses the service role key — never expose this to the frontend.
 * Used to verify Google OAuth tokens issued by Supabase Auth.
 */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default supabase;
