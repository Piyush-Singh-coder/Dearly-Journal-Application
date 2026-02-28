import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BookOpen,
  Tag,
  Calendar,
  Heart,
  Lock,
  Loader2,
  Sparkles,
  Save,
  Users,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { getSocket } from "../lib/socket";
import { useSocketStore } from "../store/socketStore";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const MOOD_MAP = {
  happy: { emoji: "😊", label: "Happy" },
  sad: { emoji: "😢", label: "Sad" },
  anxious: { emoji: "😰", label: "Anxious" },
  grateful: { emoji: "🙏", label: "Grateful" },
  angry: { emoji: "😤", label: "Angry" },
  neutral: { emoji: "😐", label: "Neutral" },
  excited: { emoji: "🎉", label: "Excited" },
  tired: { emoji: "😴", label: "Tired" },
};

export default function SharedEntryView() {
  const { token } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const {
    addCollaborator,
    removeCollaborator,
    clearCollaborators,
    collaborators,
  } = useSocketStore();

  const [entry, setEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isRemoteUpdate = useRef(false);

  // ── TipTap editor (editable only if logged in) ──────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing here..." }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-slate dark:prose-invert prose-lg max-w-none focus:outline-none min-h-[300px] leading-relaxed text-slate-700 dark:text-slate-300",
      },
    },
    editable: isAuthenticated, // only editable when logged in
  });

  // ── Fetch entry by share token ───────────────────────────────────────────
  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const res = await axios.get(`${API_URL}/entries/share/${token}`);
        const fetched = res.data.entry;
        setEntry(fetched);
        if (editor && fetched.content) {
          editor.commands.setContent(fetched.content);
        }
      } catch (err) {
        if (err.response?.status === 403) setError("private");
        else if (err.response?.status === 404) setError("notfound");
        else setError("error");
      } finally {
        setIsLoading(false);
      }
    };
    if (editor !== null) fetchEntry();
  }, [token, editor]);

  // ── WebSocket: join room once entry is loaded and user is logged in ──────
  useEffect(() => {
    if (!entry || !isAuthenticated || !user) return;

    const jwtToken = localStorage.getItem("token");
    if (!jwtToken) return;

    // Pass shareToken in socket auth so the backend can verify access
    const socket = getSocket(jwtToken, token);

    socket.emit("join-entry", entry.id);

    socket.on("user-joined", ({ socketId, userId, fullName }) => {
      addCollaborator({ socketId, userId, fullName });
    });

    socket.on("user-left", ({ socketId }) => removeCollaborator(socketId));
    socket.on("cursor-remove", (socketId) => removeCollaborator(socketId));

    socket.on("content-update", ({ html }) => {
      if (!editor) return;
      isRemoteUpdate.current = true;
      editor.commands.setContent(html, false);
      isRemoteUpdate.current = false;
    });

    return () => {
      socket.emit("leave-entry", entry.id);
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("cursor-remove");
      socket.off("content-update");
      clearCollaborators();
    };
  }, [
    entry,
    isAuthenticated,
    user,
    editor,
    addCollaborator,
    removeCollaborator,
    clearCollaborators,
  ]);

  // ── Broadcast content changes (debounced 300ms) ──────────────────────────
  useEffect(() => {
    if (!editor || !entry || !isAuthenticated) return;
    const jwtToken = localStorage.getItem("token");
    if (!jwtToken) return;

    let timer = null;
    const onUpdate = () => {
      if (isRemoteUpdate.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const socket = getSocket(jwtToken, token);
        socket.emit("content-change", {
          entryId: entry.id,
          html: editor.getHTML(),
        });
      }, 300);
    };

    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      clearTimeout(timer);
    };
  }, [editor, entry, isAuthenticated, token]);

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!entry || !isAuthenticated) return;
    setIsSaving(true);
    try {
      const jwtToken = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/entries/${entry.id}`,
        { content: editor.getHTML() },
        { headers: { Authorization: `Bearer ${jwtToken}` } },
      );
      toast.success("Saved!");
    } catch {
      toast.error("Failed to save. You may not have edit permission.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Error / Loading states ───────────────────────────────────────────────
  if (isLoading) return <Spinner />;
  if (error === "private")
    return (
      <ErrorScreen
        icon={<Lock className="w-12 h-12 text-slate-400" />}
        title="This entry is private"
        description="The author hasn't made this entry publicly available."
      />
    );
  if (error === "notfound")
    return (
      <ErrorScreen
        icon={<BookOpen className="w-12 h-12 text-slate-400" />}
        title="Entry not found"
        description="This link may have expired or the entry was deleted."
      />
    );
  if (error)
    return (
      <ErrorScreen
        icon={<Sparkles className="w-12 h-12 text-slate-400" />}
        title="Something went wrong"
        description="Couldn't load this entry. Try again later."
      />
    );

  const mood = MOOD_MAP[entry.mood] || null;
  const entryDate = entry.date ? new Date(entry.date) : null;
  const collabList = Object.values(collaborators);

  return (
    <div className="min-h-screen bg-[#fdf6f0] dark:bg-[#0f0f0f] flex flex-col font-display">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-[#fdf6f0]/80 dark:bg-[#0f0f0f]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <Heart className="w-5 h-5 text-primary fill-primary transition-transform group-hover:scale-110" />
            <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
              Dearly
            </span>
          </Link>

          <div className="flex items-center gap-3 min-w-0">
            {/* Live collaborators */}
            {collabList.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                <Users className="w-3.5 h-3.5" />
                {collabList.slice(0, 3).map((c) => (
                  <span
                    key={c.userId}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: c.color }}
                    title={c.fullName}
                  >
                    {c.fullName?.charAt(0).toUpperCase()}
                  </span>
                ))}
              </div>
            )}

            {isAuthenticated ? (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-full text-sm font-bold hover:opacity-90 transition-all shadow disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save
              </button>
            ) : (
              <Link
                to={`/auth?redirect=/share/${token}`}
                className="text-xs font-bold text-primary hover:underline"
              >
                Sign in to edit →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {mood && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
              {mood.emoji} {mood.label}
            </span>
          )}
          {entryDate && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {format(entryDate, "MMMM d, yyyy")}
            </span>
          )}
          {entry.notebook && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              {entry.notebook.title}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-8 leading-tight">
          {entry.title}
        </h1>

        {/* Editor / Read View */}
        <div
          className={`mb-10 ${isAuthenticated ? "border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 bg-white dark:bg-slate-900/50 focus-within:ring-2 focus-within:ring-primary/20" : ""}`}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Tags */}
        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Tag className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            {entry.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-slate-400">
            Shared{" "}
            {formatDistanceToNow(new Date(entry.updatedAt || entry.createdAt), {
              addSuffix: true,
            })}{" "}
            via Dearly
          </p>
          {!isAuthenticated && (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              <Heart className="w-4 h-4 fill-primary" />
              Start your own journal
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function ErrorScreen({ icon, title, description }) {
  return (
    <div className="min-h-screen bg-[#fdf6f0] dark:bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center gap-4">
      <div className="text-slate-300 dark:text-slate-700">{icon}</div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">
        {title}
      </h1>
      <p className="text-slate-500 max-w-sm">{description}</p>
      <Link to="/" className="mt-4 text-primary font-bold hover:underline">
        ← Go home
      </Link>
    </div>
  );
}
