import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client used on the BACKEND ONLY.
 * Uses the service role key — never expose this to the frontend.
 * Used to verify Google OAuth tokens issued by Supabase Auth (if configured).
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: new Error("Supabase credentials not configured in environment variables."),
        }),
      },
    };

export default supabase;
