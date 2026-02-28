import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { verifyEmail } = useAuthStore();

  const [status, setStatus] = useState("ready"); // 'ready', 'verifying', 'success', 'already', 'error'
  const [message, setMessage] = useState("");

  const handleVerify = async () => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the URL.");
      return;
    }

    setStatus("verifying");

    try {
      const data = await verifyEmail(token);
      // Check if the backend says the user was already verified
      if (data.message?.toLowerCase().includes("already")) {
        setStatus("already");
      } else {
        setStatus("success");
      }
      setMessage(data.message);
    } catch (error) {
      setStatus("error");
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Verification failed. The link may be expired or invalid.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark font-sans flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#2a221a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuA28AmjKct9MiXl28KpgR6MMhlW5FbAVRC4Mw2FkgVUzXbM8U945dll4eUP-aSQmJdYG3anam2d07xoeNiGLSJQo_jUrZc-6Kr3wKhQLM2BEMyO1jENd26bjFfbSx0Fp-ludjeyg58EhILDq37tsuJQSipN3C3CpsIzwUIz3gD7Fd1S6FKdH5F7Ut7eKIAKrkzZiDm5O-3P1O41Tmg4NszvBIEm2BYa1MvWhW_Gfh1dHCFwQgmbSvbdLi-45o3w8d4MacFW5j6x1qA')] opacity-5 mix-blend-overlay pointer-events-none rounded-2xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo */}
          <div
            className="flex items-center gap-3 mb-8 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="text-primary group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Dearly
            </h1>
          </div>

          {/* ── Ready: Show verify button ── */}
          {status === "ready" && (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Verify Your Email
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Click the button below to confirm your email address and
                activate your account.
              </p>
              <button
                onClick={handleVerify}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                Verify My Email
              </button>
            </div>
          )}

          {/* ── Verifying: Spinner ── */}
          {status === "verifying" && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Verifying...
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {/* ── Success: Verified ── */}
          {status === "success" && (
            <div className="flex flex-col items-center">
              <CheckCircle className="w-20 h-20 text-emerald-500 mb-6 drop-shadow-lg" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Email Verified!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Your account is now active. You can sign in and start
                journaling.
              </p>
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                Sign In to Continue
              </button>
            </div>
          )}

          {/* ── Already Verified ── */}
          {status === "already" && (
            <div className="flex flex-col items-center">
              <CheckCircle className="w-20 h-20 text-sky-500 mb-6 drop-shadow-lg" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Already Verified
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Your email is already verified. You can go ahead and sign in!
              </p>
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                Sign In
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {status === "error" && (
            <div className="flex flex-col items-center">
              <XCircle className="w-20 h-20 text-rose-500 mb-6 drop-shadow-lg" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Verification Failed
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                {message}
              </p>
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
