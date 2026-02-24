import React from "react";
import { useAuthStore } from "../store/authStore";

export default function PersonalJournal() {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto py-8">
      <h2 className="mb-8">Welcome back, {user?.fullName || "Writer"}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for Entry Cards */}
        <div className="card-elevated min-h-[200px] flex flex-col justify-between group cursor-pointer hover:shadow-elevation3 transition-shadow">
          <div>
            <span className="text-secondary dark:text-secondary-dark text-xs font-medium uppercase tracking-wider mb-2 block">
              Today
            </span>
            <h4 className="mb-2 font-medium">A new beginning</h4>
            <p className="text-secondary dark:text-secondary-dark text-sm line-clamp-3">
              This is a placeholder entry just to show how the UI components
              render within the dashboard layout while we are still building the
              real entry list component...
            </p>
          </div>
          <div className="mt-4 flex justify-between items-center text-xs text-outline dark:text-outline-dark">
            <span>Private</span>
            <span>Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
