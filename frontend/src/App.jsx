import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { BookOpen } from "lucide-react";

// Layouts & Pages (To be created)
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import VerifyEmail from "./pages/VerifyEmail";
import DashboardLayout from "./layouts/DashboardLayout";
import PersonalJournal from "./pages/PersonalJournal";
import EntryEditor from "./pages/EntryEditor";
import CommunityFeed from "./pages/CommunityFeed";
import TeamLayout from "./pages/TeamLayout";
import SharedEntryView from "./pages/SharedEntryView";
import JoinNotebook from "./pages/JoinNotebook";
import SettingsPage from "./pages/SettingsPage";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

function App() {
  const { user, checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Apply theme to document globally
  useEffect(() => {
    const theme = user?.settings?.theme || "system";
    const applyTheme = (t) => {
      const isDark =
        t === "dark" ||
        (t === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    applyTheme(theme);
  }, [user?.settings?.theme]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-surface dark:bg-surface-dark overflow-hidden font-display">
        <div className="relative">
          <BookOpen className="w-16 h-16 text-primary animate-pulse relative z-10" />
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse delay-75 scale-150"></div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <span className="text-primary font-black text-xl tracking-tight">
            Dearly
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-[10px] animate-pulse">
            Opening your sanctuary...
          </span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface dark:bg-surface-dark text-surface-dark dark:text-surface-container font-sans selection:bg-primary-container selection:text-primary-dark">
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              "bg-surface-container dark:bg-surface-container-dark text-surface-dark dark:text-white rounded-m3-md shadow-elevation2 font-bold",
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/share/:token" element={<SharedEntryView />} />
          <Route path="/join/:token" element={<JoinNotebook />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PersonalJournal />} />
            <Route path="entry/:id" element={<EntryEditor />} />
            <Route path="community" element={<CommunityFeed />} />
            <Route path="team" element={<TeamLayout />} />
            <Route path="team/:notebookId" element={<TeamLayout />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
