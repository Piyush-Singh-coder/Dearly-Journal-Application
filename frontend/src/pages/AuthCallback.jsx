import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

/**
 * AuthCallback
 *
 * Supabase redirects the browser here after a successful Google OAuth sign-in.
 * The URL will contain the session tokens as a hash fragment, e.g.:
 *   /auth/callback#access_token=...&token_type=bearer&...
 *
 * This page:
 *  1. Reads the Supabase session from the URL hash
 *  2. Sends the access_token to our backend to issue our own JWT
 *  3. Redirects to /dashboard on success, or /auth?mode=login on failure
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithSupabaseSession } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      // `getSession` reads the hash fragment that Supabase appends to the URL
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        console.error("OAuth callback error:", error);
        toast.error("Google sign-in failed. Please try again.");
        navigate("/auth?mode=login");
        return;
      }

      try {
        await loginWithSupabaseSession(session.access_token);
        toast.success("Signed in with Google!");
        navigate("/dashboard");
      } catch {
        toast.error("Could not authenticate with server. Please try again.");
        navigate("/auth?mode=login");
      }
    };

    handleCallback();
  }, [navigate, loginWithSupabaseSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-secondary dark:text-secondary-dark font-medium">
          Completing Google sign-in…
        </p>
      </div>
    </div>
  );
}
