import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark flex flex-col justify-center items-center px-4 overflow-hidden relative">
      {/* Decorative calm background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container dark:bg-primary-container-dark rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tertiary dark:bg-tertiary-dark rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] opacity-20 animate-pulse animation-delay-2000"></div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 text-center max-w-2xl px-4"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-surface-container dark:bg-surface-container-dark rounded-m3-xl shadow-elevation2 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary dark:text-primary-dark" />
          </div>
        </div>

        <h1 className="text-[#1D1B20] dark:text-[#E6E1E5] mb-6 tracking-tight">
          Write what matters.
        </h1>

        <p className="text-xl md:text-2xl text-secondary dark:text-secondary-dark mb-12 font-light">
          Private by default. Shared on your terms.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link
            to="/auth?mode=signup"
            className="btn-filled w-full sm:w-auto text-center text-lg px-8 py-3"
          >
            Get Started
          </Link>
          <Link
            to="/auth?mode=login"
            className="btn-tonal w-full sm:w-auto text-center text-lg px-8 py-3"
          >
            Sign In
          </Link>
        </div>

        {/* Features Minimal List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-lg mx-auto">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-primary mt-1" />
            <div>
              <h4 className="font-medium text-[#1D1B20] dark:text-[#E6E1E5] text-lg">
                Safe space
              </h4>
              <p className="text-secondary dark:text-secondary-dark text-sm mt-1">
                End-to-end encrypted feel. Your thoughts remain yours alone.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Users className="w-6 h-6 text-tertiary mt-1" />
            <div>
              <h4 className="font-medium text-[#1D1B20] dark:text-[#E6E1E5] text-lg">
                Shared gently
              </h4>
              <p className="text-secondary dark:text-secondary-dark text-sm mt-1">
                Share anonymously to the community or invite trusted friends.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
