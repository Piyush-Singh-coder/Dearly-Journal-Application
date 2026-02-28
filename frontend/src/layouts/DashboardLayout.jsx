import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  Home,
  User,
  Users,
  Globe,
  Settings,
  LogOut,
  BookOpen,
  Menu,
  Search,
  Bell,
  X,
  Sun,
  Moon,
} from "lucide-react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

const NAV_ITEMS = [
  { name: "Home", path: "/dashboard", icon: Home, end: true },
  { name: "Notebooks", path: "/dashboard/team", icon: BookOpen, end: false },
  { name: "Community", path: "/dashboard/community", icon: Globe, end: false },
  { name: "Settings", path: "/dashboard/settings", icon: Settings, end: false },
];

export default function DashboardLayout() {
  const { user, logout, updateSettings } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface dark:bg-surface-dark text-slate-900 dark:text-white antialiased">
      {/* 
        =============================================
        TOP APP BAR
        =============================================
      */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 dark:border-outline-dark/20 bg-surface-container dark:bg-surface-container-dark z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
          >
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-xl font-bold tracking-tight hidden sm:block">
              Dearly
            </span>
          </NavLink>
        </div>

        {/* Removed functionality-less search bar */}
        <div className="flex-1 max-w-2xl px-4 sm:px-8"></div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={async () => {
              const currentTheme = user?.settings?.theme || "system";
              const isCurrentlyDark =
                currentTheme === "dark" ||
                (currentTheme === "system" &&
                  document.documentElement.classList.contains("dark"));
              const newTheme = isCurrentlyDark ? "light" : "dark";

              // Apply immediately for snappy UI
              if (newTheme === "dark") {
                document.documentElement.classList.add("dark");
              } else {
                document.documentElement.classList.remove("dark");
              }

              // Persist to store
              if (updateSettings) {
                try {
                  await updateSettings({ theme: newTheme });
                } catch (error) {
                  // Revert if failed (optional, but store fetch usually covers it)
                  console.error("Failed to save theme", error);
                }
              }
            }}
            className="hidden sm:flex p-2 rounded-full hover:bg-surface-variant dark:hover:bg-surface-variant-dark text-slate-600 dark:text-slate-400 transition-colors"
            title="Toggle Theme"
          >
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </button>
          <div
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/20 overflow-hidden border-2 border-primary/30 cursor-pointer hover:border-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <img
              src={
                user?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=random`
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 
          =============================================
          DESKTOP NAVIGATION RAIL
          =============================================
        */}
        <aside className="hidden md:flex flex-col items-center w-24 py-4 bg-surface-container dark:bg-surface-container-dark border-r border-slate-200 dark:border-outline-dark/20 space-y-6 shrink-0 z-10 transition-colors overflow-y-auto hide-scrollbar">
          <div className="flex flex-col items-center gap-4 w-full mt-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    "group flex flex-col items-center gap-1.5 w-full transition-colors",
                    isActive
                      ? "text-primary dark:text-primary"
                      : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={clsx(
                        "px-5 py-2.5 transition-all duration-200 flex items-center justify-center",
                        // Soft corners with square-ish shape for active states
                        "rounded-xl",
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "group-hover:bg-primary/5 text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-primary",
                      )}
                    >
                      <item.icon
                        className={clsx(
                          "w-6 h-6 transition-transform",
                          isActive ? "scale-110" : "group-hover:scale-110",
                        )}
                        fill={isActive ? "currentColor" : "none"}
                        fillOpacity={isActive ? 0.2 : 0}
                      />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide">
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </aside>

        {/* 
          =============================================
          MAIN CONTENT AREA
          =============================================
        */}
        <main className="flex-1 overflow-y-auto bg-surface dark:bg-surface-dark transition-colors pb-20 md:pb-0 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 
        =============================================
        MOBILE BOTTOM NAVIGATION
        =============================================
      */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container dark:bg-surface-container-dark border-t border-slate-200 dark:border-outline-dark/20 flex justify-around items-center px-2 py-2 pb-safe z-40 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] transition-colors">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                "group flex flex-col items-center justify-center w-16 h-14 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-slate-500 dark:text-slate-400 hover:text-primary",
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={clsx(
                    "px-4 py-1.5 transition-all duration-200 flex items-center justify-center rounded-xl",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "group-hover:bg-primary/5",
                  )}
                >
                  <item.icon
                    className="w-5 h-5 transition-transform"
                    fill={isActive ? "currentColor" : "none"}
                    fillOpacity={isActive ? 0.2 : 0}
                  />
                </div>
                <span className="text-[10px] font-medium mt-1">
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Mobile Menu / Profile Modal */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-end p-4 sm:p-6"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-surface-container dark:bg-surface-container-dark w-full max-w-sm rounded-2xl p-6 shadow-2xl mt-14"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Account
                </h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-surface-variant dark:bg-surface-variant-dark border border-slate-200 dark:border-outline-dark/20">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 shrink-0">
                  <img
                    src={
                      user?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=random`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/dashboard/settings");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-variant dark:hover:bg-surface-variant-dark text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  <Settings className="w-5 h-5 text-slate-400" /> Settings
                </button>
                <div className="h-px bg-slate-200 dark:bg-outline-dark/20 my-2"></div>
                <button
                  onClick={async () => {
                    await handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 font-medium transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-500" /> Log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
