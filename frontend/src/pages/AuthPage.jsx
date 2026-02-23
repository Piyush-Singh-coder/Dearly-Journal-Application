import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen } from "lucide-react";
import toast from "react-hot-toast";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "login";

  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const { login, signup, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login({ email, password });
        toast.success("Welcome back!");
      } else {
        await signup({ email, password, fullName });
        toast.success("Account created successfully!");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Authentication failed",
      );
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Decorative minimal background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-container dark:bg-primary-container-dark rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[120px] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div
          className="flex justify-center mb-8 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-16 h-16 bg-surface-container dark:bg-surface-container-dark rounded-m3-xl shadow-elevation1 flex items-center justify-center hover:shadow-elevation2 transition-shadow">
            <BookOpen className="w-8 h-8 text-primary dark:text-primary-dark" />
          </div>
        </div>

        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-filled w-full shadow-elevation2 p-8"
        >
          <h2 className="text-center mb-2">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-center text-secondary dark:text-secondary-dark mb-8 text-sm">
            {isLogin
              ? "Sign in to access your journal"
              : "Begin your private journaling journey"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col"
                >
                  <label
                    htmlFor="fullName"
                    className="text-sm text-slate-900 dark:text-white font-medium mb-1 ml-1 cursor-pointer"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required={!isLogin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col">
              <label
                htmlFor="email"
                className="text-sm text-slate-900 dark:text-white font-medium mb-1 ml-1 cursor-pointer"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex. you@example.com"
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="password"
                className="text-sm text-slate-900 dark:text-white font-medium mb-1 ml-1 cursor-pointer"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-filled mt-4 w-full flex justify-center py-3"
            >
              {isLoading
                ? "Processing..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
            </button>
            <div className="flex items-center my-4 before:flex-1 before:border-t before:border-outline-dark after:flex-1 after:border-t after:border-outline-dark">
              <p className="text-center text-secondary dark:text-secondary-dark text-xs mx-4 uppercase font-medium tracking-wider">
                Or
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                (window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/auth/google`)
              }
              className="btn-outlined w-full flex justify-center py-3 items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="btn-text text-sm"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
