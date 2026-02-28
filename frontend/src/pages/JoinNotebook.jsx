import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore, axiosInstance } from "../store/authStore";
import { Heart, Loader2, BookOpen, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function JoinNotebook() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [status, setStatus] = useState("idle"); // idle | joining | success | error
  const [notebook, setNotebook] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // If not logged in, redirect to auth and come back after
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/auth?redirect=/join/${token}`, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, token]);

  // Auto-join once logged in
  useEffect(() => {
    if (!isAuthenticated || !token || status !== "idle") return;

    const join = async () => {
      setStatus("joining");
      try {
        const res = await axiosInstance.post(`/notebooks/join/${token}`);
        setNotebook(res.data.notebook);
        setStatus("success");
        toast.success(`Joined "${res.data.notebook?.title || "notebook"}"!`);
        // Redirect to team page after 2s
        setTimeout(() => navigate("/dashboard/team", { replace: true }), 2000);
      } catch (err) {
        const msg =
          err.response?.data?.message || "Invalid or expired invite link.";
        setErrorMsg(msg);
        setStatus("error");
      }
    };

    join();
  }, [isAuthenticated, token, status, navigate]);

  if (authLoading || status === "idle") {
    return (
      <Screen
        icon={<Loader2 className="w-10 h-10 text-primary animate-spin" />}
        title="Loading…"
      />
    );
  }

  if (status === "joining") {
    return (
      <Screen
        icon={<Loader2 className="w-10 h-10 text-primary animate-spin" />}
        title="Joining notebook…"
      />
    );
  }

  if (status === "success") {
    return (
      <Screen
        icon={<CheckCircle2 className="w-12 h-12 text-emerald-500" />}
        title={`Joined "${notebook?.title || "the notebook"}"!`}
        description="Redirecting you to the Team page…"
      />
    );
  }

  return (
    <Screen
      icon={<XCircle className="w-12 h-12 text-red-500" />}
      title="Couldn't join"
      description={errorMsg}
    >
      <button
        onClick={() => navigate("/dashboard/team")}
        className="mt-4 bg-primary text-white px-6 py-2 rounded-full font-bold hover:opacity-90 transition"
      >
        Go to Team
      </button>
    </Screen>
  );
}

function Screen({ icon, title, description, children }) {
  return (
    <div className="min-h-screen bg-[#fdf6f0] dark:bg-[#0f0f0f] flex flex-col">
      <header className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary fill-primary" />
        <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
          Dearly
        </span>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
        <div>{icon}</div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-slate-500 max-w-sm">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
