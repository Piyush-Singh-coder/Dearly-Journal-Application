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
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { name: "Home", path: "/dashboard", icon: Home, end: true },
  { name: "Personal", path: "/dashboard/personal", icon: User },
  { name: "Team", path: "/dashboard/team", icon: Users },
  { name: "Community", path: "/dashboard/community", icon: Globe },
  { name: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark flex flex-col md:flex-row">
      {/* 
        =============================================
        DESKTOP NAVIGATION (Material 3 Navigation Rail)
        =============================================
      */}
      <aside className="hidden md:flex flex-col w-[80px] bg-surface-container dark:bg-surface-container-dark py-6 items-center shadow-elevation1 z-20 shrink-0">
        <div className="mb-8 w-12 h-12 bg-primary-container dark:bg-primary-container-dark text-primary dark:text-primary-dark rounded-m3-md flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>

        <nav className="flex-1 flex flex-col gap-4 w-full items-center">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  "group flex flex-col items-center justify-center p-2 rounded-m3-lg w-14 h-14 relative transition-colors",
                  isActive
                    ? "text-surface-dark dark:text-white"
                    : "text-secondary dark:text-secondary-dark hover:bg-surface-dark/5 dark:hover:bg-white/5",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-rail"
                      className="absolute inset-0 bg-primary-container dark:bg-primary-container-dark rounded-m3-xl -z-10"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <item.icon
                    className={clsx(
                      "w-6 h-6 mb-1",
                      isActive
                        ? "text-[#1D1B20] dark:text-[#E6E1E5]"
                        : "text-outline dark:text-outline-dark",
                    )}
                  />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline/30">
            <img
              src={
                user?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${user?.fullName || "User"}&background=random`
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={handleLogout}
            className="text-secondary dark:text-secondary-dark hover:text-error dark:hover:text-error-dark p-2 rounded-full hover:bg-surface-dark/5 dark:hover:bg-white/5 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* 
        =============================================
        MOBILE TOP BAR
        =============================================
      */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface dark:bg-surface-dark z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline/30">
            <img
              src={
                user?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${user?.fullName || "User"}&background=random`
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-medium text-[#1D1B20] dark:text-[#E6E1E5] text-lg tracking-tight">
            Dearly
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-secondary dark:text-secondary-dark"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Drawer (Simplistic overlay for extra nav like logout) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="bg-surface-container dark:bg-surface-container-dark w-full max-w-sm rounded-m3-xl p-6 shadow-elevation3"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-6 font-medium text-center">Menu</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="btn-text w-full flex items-center justify-center gap-2 text-error dark:text-error-dark"
                >
                  <LogOut className="w-5 h-5" /> Log out
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-tonal w-full mt-4"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        =============================================
        MAIN CONTENT AREA
        =============================================
      */}
      <main className="flex-1 bg-surface dark:bg-surface-dark relative pb-20 md:pb-0 overflow-y-auto w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 rounded-tl-3xl">
        <Outlet />
      </main>

      {/* 
        =============================================
        MOBILE BOTTOM NAVIGATION (Material 3 standard)
        =============================================
      */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container dark:bg-surface-container-dark flex justify-around items-center px-2 py-2 pb-safe z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.end}
            className="relative flex flex-col items-center justify-center w-16 h-14"
          >
            {({ isActive }) => (
              <>
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={clsx(
                      "w-12 h-8 rounded-m3-full flex items-center justify-center transition-colors",
                      isActive
                        ? "bg-primary-container dark:bg-primary-container-dark text-[#1D1B20] dark:text-[#E6E1E5]"
                        : "text-secondary dark:text-secondary-dark",
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span
                    className={clsx(
                      "text-[10px] font-medium mt-1 transition-colors",
                      isActive
                        ? "text-[#1D1B20] dark:text-[#E6E1E5]"
                        : "text-secondary dark:text-secondary-dark",
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
