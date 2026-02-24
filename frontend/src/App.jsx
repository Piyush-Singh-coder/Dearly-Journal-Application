import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";

// Layouts & Pages (To be created)
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./layouts/DashboardLayout";
import PersonalJournal from "./pages/PersonalJournal";
// import TeamLayout from "./pages/TeamLayout";
// import CommunityFeed from './pages/CommunityFeed';
// import EntryEditor from './pages/EntryEditor';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface dark:bg-surface-dark text-primary font-medium tracking-wide">
        Dearly...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface dark:bg-surface-dark text-surface-dark dark:text-surface-container font-sans selection:bg-primary-container selection:text-primary-dark">
        <Toaster
          position="bottom-center"
          toastOptions={{
            className:
              "bg-surface-container dark:bg-surface-container-dark text-surface-dark dark:text-white rounded-m3-md shadow-elevation2",
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            {/* 
            <Route path="team" element={<TeamLayout />} />
            <Route path="community" element={<CommunityFeed />} />
            <Route path="settings" element={<div>Settings</div>} /> 
            */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
