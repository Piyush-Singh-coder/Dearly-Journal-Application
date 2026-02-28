import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Eye, Mail, Lock, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import logoImg from "../assets/dearly-logo.png";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get("mode");

  const [isLogin, setIsLogin] = useState(modeParam !== "signup");
  const [verificationEmail, setVerificationEmail] = useState(null);

  useEffect(() => {
    setIsLogin(modeParam !== "signup");
  }, [modeParam]);

  const toggleMode = () => {
    setSearchParams({ mode: isLogin ? "signup" : "login" });
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, signup, googleLogin, isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login({ email, password });
        toast.success("Welcome back!");
      } else {
        await signup({ email, password, fullName });
        setVerificationEmail(email);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Authentication failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginImage =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuACuGsIFuXcl8UBj4fnibKMKp3b-9fYZmpGy_hm0Ou7vgsX9ajPMYfPHpgU3-51wAsKt970ZWI0YK9XyK3-57x4LZCjZdSsBAofOcQZU-45jyWVTrczvyz8DCId4gCUrmDt4RR-yb-XbcZhGje_c-5xtj8Fs1I3iLIbT3MT_JXS2Yu6CfXAqzXKvuTLZ3gy7Lno8iEVJknKlAqfjYSQMxuWz2uCdXiSLZV94eHZDs2mGboAkenhgyo7KtpM7Bh-FPQ7cMScvh3950Y";
  const registerImage =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBhtrfpuLpkeofQTkj5b2xvMdrcsQd4VqOlTdtVHXsx8pfmrM6rqaCoKNS2JyZeeapoHWtGGPquLWP3_T0RAkt5IMldipG5aRJHDM5hSqpmVjkPW4foKqFr61XfWbwiDFUuSeBalpdMw4y_ktJXotBK8ZeKfXLzVdYpLhcF5ghu0lnrEaeE8l5Xse2VF3VietvRrZG44hNmvhVeviaKfeupvcdkIktRlr4xR9rfbfZ4xlrPCzpqo4VS3kUguwlJADlnWlYAg2Y2mbI";

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark font-sans flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-primary/5 blur-[100px] rounded-full"></div>
      </div>

      {/* Book Container */}
      <div className="relative w-full max-w-6xl flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#2a221a] min-h-[600px] md:min-h-[650px] lg:min-h-[750px] z-10">
        {/* Left Page: Form */}
        <div className="flex-1 relative px-6 md:px-10 lg:px-12 py-8 lg:py-12 flex flex-col justify-start border-b md:border-b-0 border-slate-200 dark:border-black/20 z-10 bg-white dark:bg-[#2a221a] overflow-y-auto webkit-scrollbar-hide">
          {/* Subtle paper texture overlay */}
          <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuA28AmjKct9MiXl28KpgR6MMhlW5FbAVRC4Mw2FkgVUzXbM8U945dll4eUP-aSQmJdYG3anam2d07xoeNiGLSJQo_jUrZc-6Kr3wKhQLM2BEMyO1jENd26bjFfbSx0Fp-ludjeyg58EhILDq37tsuJQSipN3C3CpsIzwUIz3gD7Fd1S6FKdH5F7Ut7eKIAKrkzZiDm5O-3P1O41Tmg4NszvBIEm2BYa1MvWhW_Gfh1dHCFwQgmbSvbdLi-45o3w8d4MacFW5j6x1qA')] opacity-5 mix-blend-overlay pointer-events-none rounded-l-2xl"></div>

          <div className="max-w-md mx-auto w-full relative z-10 my-auto shrink-0 pt-4">
            <div
              className="flex items-center gap-3 mb-10 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="text-primary group-hover:scale-105 transition-transform duration-300">
                <img
                  src={logoImg}
                  alt="Dearly Logo"
                  className="w-10 h-10 object-contain drop-shadow-sm"
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Dearly
              </h1>
            </div>

            {/* ── Check Your Inbox Screen (shown after signup) ── */}
            {verificationEmail ? (
              <motion.div
                key="check-inbox"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">
                  Check Your Inbox
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  We sent a verification link to:
                </p>
                <div className="bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-primary/20 rounded-xl px-4 py-2.5 text-primary font-bold text-sm mb-6 w-full">
                  {verificationEmail}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                  Click the link in the email to verify your account. After
                  that, come back here to sign in.
                </p>
                <button
                  onClick={() => {
                    setVerificationEmail(null);
                    setSearchParams({ mode: "login" });
                  }}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                >
                  Go to Sign In
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                  Didn't receive the email? Check your spam folder.
                </p>
              </motion.div>
            ) : (
              /* ── Login / Register Form ── */
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? "login" : "register"}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
                    {isLogin ? "Welcome back" : "Begin Your Journey"}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm md:text-base leading-relaxed">
                    {isLogin
                      ? "Enter your details to continue your journey."
                      : "Create an account to start your personal archive and preserve your memories."}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <AnimatePresence>
                      {!isLogin && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-1.5 overflow-hidden"
                        >
                          <label
                            htmlFor="fullName"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1"
                          >
                            Full Name
                          </label>
                          <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                              id="fullName"
                              type="text"
                              required={!isLogin}
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="John Doe"
                              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-primary/20 text-slate-900 dark:text-slate-100 pl-12 pr-4 py-4 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-primary/20 text-slate-900 dark:text-slate-100 pl-12 pr-4 py-4 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label
                          htmlFor="password"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Password
                        </label>
                        {isLogin && (
                          <a
                            href="#"
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Forgot Password?
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-primary/20 text-slate-900 dark:text-slate-100 pl-12 pr-12 py-4 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-8 active:scale-[0.98] disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        "Processing..."
                      ) : (
                        <>
                          <span>{isLogin ? "Sign In" : "Create Account"}</span>
                          <svg
                            className="w-5 h-5 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </>
                      )}
                    </button>

                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        Or continue with
                      </span>
                      <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => googleLogin()}
                      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                        />
                      </svg>
                      Google
                    </button>
                  </form>

                  <div className="mt-8 text-center pt-2">
                    <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-1">
                      <span>
                        {isLogin
                          ? "Don't have an account?"
                          : "Already have an account?"}
                      </span>
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="text-primary font-bold hover:underline underline-offset-4 transition-all outline-none focus:text-primary-dark"
                      >
                        {isLogin ? "Create Account" : "Sign In"}
                      </button>
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-20 text-[10px] tracking-[0.2em] font-bold uppercase text-slate-900 dark:text-slate-300 whitespace-nowrap hidden lg:block">
              {isLogin ? "Chapter I: Reflection" : "Prologue: The Blank Page"}
            </div>
          </div>
        </div>

        {/* Center Fold / Spine (Visible only on desktop) */}
        <div className="hidden md:block w-4 lg:w-8 bg-gradient-to-r from-black/5 via-black/10 dark:via-black/50 to-black/5 z-20 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] border-r border-l border-black/5 dark:border-black/20"></div>

        {/* Right Page: Media */}
        <div className="hidden md:flex flex-1 relative overflow-hidden flex-col bg-[#251d16]">
          {/* Subtle paper texture overlay */}
          <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuA28AmjKct9MiXl28KpgR6MMhlW5FbAVRC4Mw2FkgVUzXbM8U945dll4eUP-aSQmJdYG3anam2d07xoeNiGLSJQo_jUrZc-6Kr3wKhQLM2BEMyO1jENd26bjFfbSx0Fp-ludjeyg58EhILDq37tsuJQSipN3C3CpsIzwUIz3gD7Fd1S6FKdH5F7Ut7eKIAKrkzZiDm5O-3P1O41Tmg4NszvBIEm2BYa1MvWhW_Gfh1dHCFwQgmbSvbdLi-45o3w8d4MacFW5j6x1qA')] opacity-5 mix-blend-overlay pointer-events-none z-10 rounded-r-2xl"></div>

          <AnimatePresence mode="wait">
            <motion.img
              key={isLogin ? "loginImg" : "regImg"}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              src={isLogin ? loginImage : registerImage}
              alt="Atmospheric desk scene"
              className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity"
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410] via-transparent to-transparent z-10"></div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="audio-player"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-12 left-12 right-12 z-20"
              >
                <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">
                        Focus Audio
                      </p>
                      <h3 className="text-white font-medium text-sm">
                        Summer Rain in Kyoto
                      </h3>
                    </div>
                    <div className="ml-auto">
                      <button className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors">
                        <svg
                          className="w-5 h-5 ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-8 px-2">
                    {[
                      40, 60, 100, 50, 80, 40, 70, 100, 60, 30, 80, 50, 90, 40,
                    ].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full bg-primary"
                        style={{ height: `${h}%`, opacity: h / 100 }}
                      ></div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="quote"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.2 }}
                className="absolute top-1/4 left-12 right-12 z-20"
              >
                <p className="text-3xl lg:text-4xl font-light text-white italic leading-relaxed opacity-90 font-display drop-shadow-md">
                  "Memories are the architecture of our souls. Build yours with
                  care."
                </p>
                <div className="w-12 h-1 bg-primary mt-6 rounded-full shadow-lg border border-primary-dark"></div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30 text-[10px] tracking-[0.2em] font-bold uppercase text-white whitespace-nowrap z-20 hidden lg:block">
            {isLogin ? "01" : "00"}
          </div>
        </div>
      </div>
    </div>
  );
}
