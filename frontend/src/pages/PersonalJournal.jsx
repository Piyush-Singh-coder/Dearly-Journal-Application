import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore, axiosInstance } from "../store/authStore";
import { useEntryStore } from "../store/entryStore";
import BookCover from "../components/BookCover";
import { Settings, LogOut, Minus } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import clsx from "clsx";
import {
  Plus,
  BookOpen,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Flame,
  CloudRain,
  Waves,
  TrendingUp,
  Flame as StreakIcon,
  CalendarDays,
  PenLine,
  ChevronRight,
  LibraryBig,
  Quote,
  Heart,
} from "lucide-react";

// --- Custom Hooks & Helpers ---
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const useTimeGreeting = () => {
  const [greeting, setGreeting] = useState(getGreeting);
  useEffect(() => {
    // Only update if greeting changes to avoid unnecessary re-renders
    const interval = setInterval(() => {
      const newGreeting = getGreeting();
      setGreeting((prev) => (prev !== newGreeting ? newGreeting : prev));
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);
  return greeting;
};

const MOODS = [
  {
    id: "happy",
    label: "Happy",
    icon: Sun,
    color: "text-amber-500",
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
  },
  {
    id: "calm",
    label: "Calm",
    icon: Waves,
    color: "text-sky-400",
    bg: "bg-sky-400/10 hover:bg-sky-400/20",
  },
  {
    id: "reflective",
    label: "Reflective",
    icon: Moon,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10 hover:bg-indigo-400/20",
  },
  {
    id: "excited",
    label: "Excited",
    icon: Sparkles,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10 hover:bg-yellow-500/20",
  },
  {
    id: "anxious",
    label: "Anxious",
    icon: Zap,
    color: "text-purple-500",
    bg: "bg-purple-500/10 hover:bg-purple-500/20",
  },
  {
    id: "sad",
    label: "Sad",
    icon: CloudRain,
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
];

const TEMPLATES = [
  {
    id: "morning",
    title: "Morning Pages",
    icon: Sun,
    desc: "Clear your mind for the day ahead.",
  },
  {
    id: "gratitude",
    title: "Gratitude List",
    icon: Heart,
    desc: "Three things you're thankful for.",
  },
  {
    id: "idea",
    title: "Idea Dump",
    icon: Zap,
    desc: "Capture fleeting thoughts quickly.",
  },
  {
    id: "evening",
    title: "Evening Reflection",
    icon: Moon,
    desc: "Review your day before sleep.",
  },
];

export default function PersonalJournal() {
  const { user } = useAuthStore();
  const { entries, fetchEntries, isLoading } = useEntryStore();
  const navigate = useNavigate();
  const greeting = useTimeGreeting();

  // Local state for additional data not in entryStore
  const [notebooks, setNotebooks] = useState([]);
  const [communityEntries, setCommunityEntries] = useState([]);
  const [isViewingAll, setIsViewingAll] = useState(false);

  const fetchNotebooks = async () => {
    try {
      const res = await axiosInstance.get("/notebooks");
      setNotebooks(res.data.notebooks.slice(0, 5));
    } catch {
      // Ignore
    }
  };

  const fetchCommunityPulse = async () => {
    try {
      const res = await axiosInstance.get("/community/feed?limit=3");
      setCommunityEntries(res.data.entries || []);
    } catch {
      // Ignore
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchEntries();
    fetchNotebooks();
    fetchCommunityPulse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Derive stats from entries
  const stats = useMemo(() => {
    if (!entries.length) return { streak: 0, thisMonth: 0, total: 0 };

    // Total
    const total = entries.length;

    // This month
    const now = new Date();
    const thisMonth = entries.filter((e) => {
      const d = new Date(e.createdAt);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;

    // Basic streak calculation (days in a row including today or yesterday)
    let streak = 0;
    const sortedDates = [
      ...new Set(entries.map((e) => new Date(e.createdAt).toDateString())),
    ]
      .map((d) => new Date(d).getTime())
      .sort((a, b) => b - a);

    if (sortedDates.length > 0) {
      const today = new Date().setHours(0, 0, 0, 0);
      const latestDay = sortedDates[0];
      const diffDays = Math.floor((today - latestDay) / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        // active today or yesterday
        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const gap = Math.floor(
            (sortedDates[i - 1] - sortedDates[i]) / (1000 * 60 * 60 * 24),
          );
          if (gap === 1) streak++;
          else break;
        }
      }
    }

    return { total, thisMonth, streak };
  }, [entries]);

  const handleCreateWithMood = (mood) => {
    // Navigate with state so EntryEditor can prefill it
    navigate("/dashboard/entry/new", { state: { initialMood: mood } });
  };

  const handleCreateWithTemplate = (templateId) => {
    navigate("/dashboard/entry/new", { state: { template: templateId } });
  };

  const stripHtml = (html) => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const recentEntries = useMemo(() => {
    if (!entries.length) return [];
    return isViewingAll ? entries : entries.slice(0, 3);
  }, [entries, isViewingAll]);

  if (isLoading && !entries.length) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh] animate-pulse pb-20 md:pb-0">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto font-display pb-32">
      {/* ───────────────────────────────────────────────
          SECTION 1: HERO & GREETING
          ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2rem] bg-surface-container dark:bg-surface-container-dark p-8 sm:p-12 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {greeting}, {user?.fullName?.split(" ")[0] || "Friend"}
              </h1>
              {stats.streak > 0 && (
                <div
                  title={`${stats.streak} day streak!`}
                  className="flex items-center gap-1 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full font-bold text-sm border border-amber-200 dark:border-amber-500/20 shadow-sm animate-in zoom-in"
                >
                  <StreakIcon className="w-4 h-4" /> {stats.streak}
                </div>
              )}
            </div>

            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg mb-6">
              How are you feeling right now?
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleCreateWithMood(mood.id)}
                  className={clsx(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer border border-transparent active:scale-95",
                    mood.bg,
                  )}
                >
                  <mood.icon className={clsx("w-4 h-4", mood.color)} />
                  <span className={clsx("text-sm font-semibold", mood.color)}>
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate("/dashboard/entry/new")}
              className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <PenLine className="w-5 h-5" />
              Write Today's Entry
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────
          SECTION 2: STATS ROW
          ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-surface-variant-dark rounded-2xl p-4 sm:p-5 flex flex-col items-center sm:items-start border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-1">
          <BookOpen className="w-6 h-6 text-slate-400 dark:text-slate-500 mb-2" />
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
            {stats.total}
          </h3>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Entries
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-500/5 rounded-2xl p-4 sm:p-5 flex flex-col items-center sm:items-start border border-amber-100 dark:border-amber-500/10 shadow-sm transition-transform hover:-translate-y-1">
          <StreakIcon className="w-6 h-6 text-amber-500 mb-2" />
          <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-500">
            {stats.streak}
          </h3>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600/70 dark:text-amber-500/70">
            Day Streak
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-500/5 rounded-2xl p-4 sm:p-5 flex flex-col items-center sm:items-start border border-blue-100 dark:border-blue-500/10 shadow-sm transition-transform hover:-translate-y-1">
          <CalendarDays className="w-6 h-6 text-blue-500 mb-2" />
          <h3 className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {stats.thisMonth}
          </h3>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600/70 dark:text-blue-400/70">
            This Month
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────────
          SECTION 3: CONTINUE RECENT ENTRIES
          ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />{" "}
            {isViewingAll ? "All Reflections" : "Recent Reflections"}
          </h2>
          {entries.length > 3 && (
            <button
              onClick={() => setIsViewingAll(!isViewingAll)}
              className="text-sm font-semibold text-primary hover:underline flex items-center"
            >
              {isViewingAll ? "Collapse" : "View All"}{" "}
              <ChevronRight
                className={clsx(
                  "w-4 h-4 transition-transform",
                  isViewingAll && "rotate-90",
                )}
              />
            </button>
          )}
        </div>

        {recentEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => navigate(`/dashboard/entry/${entry.id}`)}
                className="group bg-white dark:bg-surface-variant-dark rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none transition-transform group-hover:scale-110"></div>

                <div className="flex flex-col gap-4 relative z-10 flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {formatDistanceToNow(new Date(entry.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {entry.mood && (
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                        {(() => {
                          const MoodDef = MOODS.find(
                            (m) => m.id === entry.mood,
                          );
                          return MoodDef ? (
                            <MoodDef.icon
                              className={clsx("w-4 h-4", MoodDef.color)}
                            />
                          ) : (
                            <Minus className="w-4 h-4 text-slate-400" />
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {entry.title || "Untitled Entry"}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {stripHtml(entry.content) || "Empty entry..."}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-primary font-bold text-sm opacity-80 group-hover:opacity-100 transition-opacity">
                    Continue Writing{" "}
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-variant-dark rounded-3xl p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Your story starts here</h3>
            <p className="text-slate-500 mb-6 max-w-sm">
              You haven't written anything yet. Capture your first thought and
              begin your journal.
            </p>
            <button
              onClick={() => navigate("/dashboard/entry/new")}
              className="btn-tonal flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create First Entry
            </button>
          </div>
        )}
      </section>

      {/* ───────────────────────────────────────────────
          SECTION 4: QUICK CAPTURE TEMPLATES
          ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold mb-4 px-1 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Quick Capture
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              onClick={() => handleCreateWithTemplate(t.id)}
              className="group bg-white dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                <t.icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                {t.title}
              </h4>
              <p className="text-xs text-slate-500">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────
          SECTION 5: NOTEBOOKS STRIP
          ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LibraryBig className="w-5 h-5 text-primary" /> Your Notebooks
          </h2>
          <Link
            to="/dashboard/team"
            className="text-sm font-semibold text-primary hover:underline flex items-center"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar snap-x">
          {notebooks.length > 0 ? (
            notebooks.map((nb, index) => (
              <div
                key={nb.id}
                className="snap-start shrink-0 w-36 sm:w-40 flex flex-col items-center"
              >
                <BookCover
                  notebook={nb}
                  index={index}
                  onClick={() => navigate(`/dashboard/team/${nb.id}`)}
                />
                <div className="mt-4 text-center w-full px-2">
                  <h4
                    className="font-bold text-sm text-slate-900 dark:text-white truncate hover:text-primary transition-colors cursor-pointer"
                    onClick={() => navigate(`/dashboard/team/${nb.id}`)}
                  >
                    {nb.title}
                  </h4>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                    {nb._count?.entries || 0} Entries
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div
              onClick={() => navigate("/dashboard/team")}
              className="snap-start shrink-0 w-40 sm:w-48 aspect-[3/4] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-8 h-8 text-slate-400 mb-2" />
              <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                Create Notebook
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ───────────────────────────────────────────────
          SECTION 6: COMMUNITY PULSE
          ─────────────────────────────────────────────── */}
      {communityEntries.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Community Pulse
            </h2>
            <Link
              to="/dashboard/community"
              className="text-sm font-semibold text-primary hover:underline flex items-center"
            >
              Explore <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communityEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => navigate(`/dashboard/community/${entry.id}`)}
                className="bg-white dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-primary/50 transition-all active:scale-95 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={
                        entry.user.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${entry.user.fullName}&background=random`
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500 truncate">
                    {entry.user.fullName}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                  {entry.title || "Untitled"}
                </h4>
                <p className="text-sm text-slate-500 line-clamp-2 h-10 mb-4">
                  {stripHtml(entry.content)}
                </p>
                <div className="mt-auto flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>{format(new Date(entry.createdAt), "MMM d")}</span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {entry._count?.likes || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
