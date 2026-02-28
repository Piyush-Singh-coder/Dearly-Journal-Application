import React, { useEffect, useState, useRef } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useEntryStore } from "../store/entryStore";
import { useAuthStore } from "../store/authStore";
import {
  uploadFile,
  deleteFile,
  getFileCategory,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_AUDIO_TYPES,
  validateFile,
} from "../lib/supabaseStorage";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Loader2,
  Mic,
  Image as ImageIcon,
  Plus,
  Maximize,
  Trash2,
  Volume2,
  FileText,
  Share2,
  Check,
  BookOpen,
  Pen,
  Paperclip,
  Book,
  Sparkles,
  Link as LinkIcon,
  Bold,
  Italic,
  List,
  Quote,
  X,
  Copy,
  MoreVertical,
  Sun,
  CloudRain,
  Zap,
  Waves,
  Flame,
  Minus,
  Moon,
  Globe,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import { getSocket } from "../lib/socket";
import { useSocketStore } from "../store/socketStore";

// TipTap WYSIWYG
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const TEMPLATE_CONTENT = {
  morning: {
    title: "Morning Pages",
    content:
      "<h2>Morning Intentions</h2><p>How am I feeling today?</p><p></p><p>What are my top 3 priorities?</p><ol><li><p></p></li><li><p></p></li><li><p></p></li></ol>",
  },
  gratitude: {
    title: "Gratitude List",
    content:
      "<h2>Today I am grateful for...</h2><ul><li><p></p></li><li><p></p></li><li><p></p></li></ul>",
  },
  idea: {
    title: "Idea Dump",
    content:
      "<h2>The Idea</h2><p></p><h2>Why it matters</h2><p></p><h2>Next Steps</h2><ul><li><p></p></li></ul>",
  },
  evening: {
    title: "Evening Reflection",
    content:
      "<h2>Daily Review</h2><p>What went well today?</p><p></p><p>What could I have done better?</p><p></p><p>What am I looking forward to tomorrow?</p><p></p>",
  },
};

export default function EntryEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    fetchEntryById,
    createEntry,
    updateEntry,
    addAttachment,
    getAttachments,
    deleteAttachment: deleteAttachmentFromDb,
    generateShareLink,
    revokeShareLink,
    duplicateEntry,
    deleteEntry,
    isLoading: storeLoading,
  } = useEntryStore();

  const location = useLocation();
  const initialMoodState = location.state?.initialMood;
  const initialTemplateState = location.state?.template;

  const isNew = id === "new";
  const [searchParams] = useSearchParams();
  const queryNotebookId = searchParams.get("notebookId");

  // Form State
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState(initialMoodState || "neutral");
  const [shareMode, setShareMode] = useState("private");
  const [tagsInput, setTagsInput] = useState("");
  const [shareToken, setShareToken] = useState(null);

  // Attachments State
  const [attachments, setAttachments] = useState([]);

  // UI State
  const [isReadMode, setIsReadMode] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [entryDate, setEntryDate] = useState(new Date());

  // Refs for file inputs
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "The ink flows like the quiet river at night...",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-slate dark:prose-invert prose-lg max-w-none focus:outline-none min-h-[300px] leading-relaxed text-slate-700 dark:text-slate-300",
      },
    },
    editable: !isReadMode,
  });

  // Keep editor editable in sync with mode
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadMode);
    }
  }, [isReadMode, editor]);

  // Load Entry Data
  useEffect(() => {
    const loadEntry = async (entryId) => {
      try {
        const entry = await fetchEntryById(entryId);
        setTitle(entry.title || "");
        setMood(entry.mood || "neutral");
        setShareMode(entry.shareMode || "private");
        setTagsInput(
          entry.tags ? entry.tags.map((t) => t.name).join(", ") : "",
        );
        setShareToken(entry.shareToken || null);
        setEntryDate(new Date(entry.createdAt || Date.now()));

        // Set editor content (HTML or plain text)
        if (editor && entry.content) {
          editor.commands.setContent(entry.content);
        }

        // Load attachments
        const loadedAtts = await getAttachments(entryId);
        setAttachments(loadedAtts);
      } catch (err) {
        console.error("Failed to load entry:", err);
        toast.error("Could not load entry");
        navigate("/dashboard");
      }
    };

    if (!isNew) {
      loadEntry(id);
    } else {
      setEntryDate(new Date());
      // Handle template injection
      if (initialTemplateState && editor && editor.isEmpty) {
        const tpl = TEMPLATE_CONTENT[initialTemplateState];
        if (tpl) {
          setTitle((prev) => prev || tpl.title);
          editor.commands.setContent(tpl.content);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    isNew,
    fetchEntryById,
    getAttachments,
    navigate,
    editor,
    initialTemplateState,
  ]);

  // ── Real-time Collaboration WebSocket hooks ──────────────────────────────
  const {
    addCollaborator,
    removeCollaborator,
    clearCollaborators,
    collaborators,
  } = useSocketStore();
  // Flag to avoid re-broadcasting remote updates back to the server
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    if (isNew || !id || !user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = getSocket(token);

    socket.emit("join-entry", id);

    socket.on("user-joined", ({ socketId, userId, fullName }) => {
      addCollaborator({ socketId, userId, fullName });
    });

    socket.on("user-left", ({ socketId }) => {
      removeCollaborator(socketId);
    });

    socket.on("cursor-remove", (socketId) => {
      removeCollaborator(socketId);
    });

    socket.on("content-update", ({ html }) => {
      if (!editor) return;
      isRemoteUpdate.current = true;
      // Preserve cursor position by using setContent only when necessary
      editor.commands.setContent(html, false);
      isRemoteUpdate.current = false;
    });

    return () => {
      socket.emit("leave-entry", id);
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("cursor-remove");
      socket.off("content-update");
      clearCollaborators();
    };
  }, [
    id,
    isNew,
    user,
    editor,
    addCollaborator,
    removeCollaborator,
    clearCollaborators,
  ]);

  // Broadcast content changes to the room (debounced)
  useEffect(() => {
    if (isNew || !editor || !id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    let debounceTimer = null;

    const handleUpdate = () => {
      if (isRemoteUpdate.current) return; // don't echo back remote updates
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const socket = getSocket(token);
        socket.emit("content-change", { entryId: id, html: editor.getHTML() });
      }, 300);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      clearTimeout(debounceTimer);
    };
  }, [id, isNew, editor]);
  // ────────────────────────────────────────────────────────────────────────────

  // Handle Save
  const handleSave = async () => {
    if (!title.trim() && editor?.isEmpty) {
      toast.error("Entry cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const tagNames = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Save as HTML from TipTap
      const content = editor?.getHTML() ?? "";

      const payload = {
        title,
        content,
        mood,
        shareMode,
        tagNames,
      };

      if (isNew) {
        const newEntry = await createEntry({
          ...payload,
          notebookId: queryNotebookId || undefined,
          date: new Date().toISOString(),
        });
        toast.success("Entry saved!");
        navigate(`/dashboard/entry/${newEntry.id}`, { replace: true });
      } else {
        const saved = await updateEntry(id, payload);
        // Sync local state from the server's authoritative response
        // so the UI reflects what was actually persisted (e.g. shareMode, mood)
        if (saved) {
          setTitle(saved.title ?? title);
          setMood(saved.mood ?? mood);
          setShareMode(saved.shareMode ?? shareMode);
          setShareToken(saved.shareToken ?? null);
          if (saved.tags?.length) {
            setTagsInput(saved.tags.map((t) => t.name).join(", "));
          }
        }
        toast.success("Entry updated!");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isNew) {
      toast.error("Please save the entry once before adding attachments.");
      return;
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const category = getFileCategory(file.type);
    if (category !== type) {
      toast.error(`Please select an ${type} file.`);
      return;
    }

    setIsUploading(true);
    let uploadResult = null;

    try {
      uploadResult = await uploadFile(file, user.id, "entries");

      const newAtt = await addAttachment(id, {
        url: uploadResult.url,
        fileType: category,
      });

      setAttachments((prev) => [
        ...prev,
        { ...newAtt, storagePath: uploadResult.storagePath },
      ]);
      toast.success("Attachment added");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Upload failed");
      if (uploadResult && uploadResult.storagePath) {
        await deleteFile(uploadResult.storagePath).catch(console.error);
      }
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // Handle Delete Attachment
  const handleDeleteAttachment = async (attachmentId, storagePathUrl) => {
    try {
      await deleteAttachmentFromDb(id, attachmentId);

      try {
        const urlParts = storagePathUrl.split("journal-attachments/");
        if (urlParts.length > 1) {
          await deleteFile(urlParts[1]);
        }
      } catch (stoErr) {
        console.warn("Could not delete from storage bucket:", stoErr);
      }

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast.success("Attachment removed");
    } catch {
      toast.error("Failed to remove attachment");
    }
  };

  // Handle Share Generation
  const handleGenerateShareLink = async () => {
    if (isNew) {
      toast.error("Please save the entry first before sharing.");
      return;
    }
    try {
      const updated = await generateShareLink(id);
      setShareToken(updated.shareToken);
      setShareMode("link");
      toast.success("Share link generated!");
    } catch {
      toast.error("Failed to generate link");
    }
  };

  const handleCopyLink = () => {
    if (!shareToken) return;
    const link = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleRevokeLink = async () => {
    try {
      await revokeShareLink(id);
      setShareToken(null);
      setShareMode("private");
      setShowShareModal(false);
      toast.success("Share link revoked. Entry is private.");
    } catch {
      toast.error("Failed to revoke link");
    }
  };

  const handleShareToCommunity = async () => {
    if (isNew) {
      toast.error("Please save the entry first before sharing.");
      return;
    }
    try {
      await updateEntry(id, { shareMode: "community" });
      setShareMode("community");
      toast.success("Entry shared to the Community Feed!");
      setShowShareModal(false);
    } catch {
      toast.error("Failed to share to community");
    }
  };

  const handleShareToTeam = () => {
    toast("To add this entry to a team notebook, open the Notebooks page.", {
      icon: "📖",
    });
  };

  const handleDuplicate = async () => {
    if (isNew) {
      toast.error("Please save the entry first before duplicating.");
      return;
    }
    try {
      const duplicated = await duplicateEntry(id);
      toast.success("Entry duplicated!");
      navigate(`/dashboard/entry/${duplicated.id}`);
      setShowOptions(false);
    } catch {
      toast.error("Failed to duplicate entry.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEntry(id);
      toast.success("Entry deleted!");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to delete entry.");
    }
  };

  if (storeLoading && !isNew && !title) {
    return (
      <div className="flex justify-center items-center h-screen bg-background-light dark:bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col pt-0">
      {/* =========================================
          Top Navigation Bar
          ========================================= */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="mr-2 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Book className="text-primary text-3xl hidden sm:block" />
          <h2 className="text-xl font-bold tracking-tight hidden sm:block">
            Dearly Entry
          </h2>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-full p-1 w-48 sm:w-64">
          <button
            onClick={() => setIsReadMode(true)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-2 sm:px-4 rounded-full text-sm font-semibold transition-all",
              isReadMode
                ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700",
            )}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Read</span>
          </button>

          <button
            onClick={() => setIsReadMode(false)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-2 sm:px-4 rounded-full text-sm font-semibold transition-all",
              !isReadMode
                ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700",
            )}
          >
            <Pen className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Write</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={
              shareMode === "link" && shareToken
                ? handleCopyLink
                : () => setShowShareModal(true)
            }
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors relative group"
            title={
              shareMode === "link" && shareToken ? "Copy share link" : "Share"
            }
          >
            {shareMode === "link" && shareToken ? (
              <>
                <LinkIcon className="w-5 h-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white dark:border-surface-dark" />
              </>
            ) : shareMode === "community" ? (
              <>
                <Globe className="w-5 h-5 text-emerald-500" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-surface-dark" />
              </>
            ) : (
              <Share2 className="w-5 h-5" />
            )}
          </button>

          {/* Options Menu */}
          {!isNew && (
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden text-sm">
                  <button
                    onClick={handleDuplicate}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                    Duplicate Entry
                  </button>
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3 transition-colors border-t border-slate-100 dark:border-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Entry
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </nav>

      {/* ── Live Collaborators Bar ─────────────────────────────────────────── */}
      {Object.values(collaborators).length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
          <span className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Live
          </span>
          <span className="text-indigo-400 dark:text-indigo-700">·</span>
          <div className="flex items-center gap-1.5">
            {Object.values(collaborators).map((c) => (
              <span
                key={c.userId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-bold"
                style={{ backgroundColor: c.color }}
                title={c.fullName}
              >
                {c.fullName?.charAt(0).toUpperCase()}
                <span className="font-normal opacity-80 max-w-[80px] truncate">
                  {c.fullName}
                </span>
              </span>
            ))}
          </div>
          <span className="ml-auto text-indigo-400 dark:text-indigo-600">
            also editing
          </span>
        </div>
      )}

      {/* =========================================
          Main Content: The Book Spread
          ========================================= */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative">
        <div className="relative w-full max-w-6xl aspect-auto md:aspect-[1.4/1] bg-slate-50 dark:bg-[#2c221a] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[800px] md:min-h-0">
          {/* Texture Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCKPityuHXNAtwgIoj9p9YsqHzd7YNoyqhOOoKJLEStzBWQo1cI0CyF4dJ6YmkuVpeEcz3IhFL3BQDPiWjJk0kfkcT4jAvtkH8mlD_zd1eBSYBXnOTuxLU1hMylWVLDEq2Ewqz8OrCKZ9AiYeZFMkqlm6Fqqhq_xF63pcNBxw6hmgeCokl8uTb4HsvCaNJ1s5JEQ_25EQvsKDe1rTGIhAkmp-Ctol5QaFqKPDirPgDy1zzFv5nS3suRDVHOtN7oWqs7k7-pfn39el8')",
            }}
          ></div>

          {/* Center Fold Shadow */}
          <div
            className="hidden md:block absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                "linear-gradient(to right, transparent 45%, rgba(0, 0, 0, 0.15) 49%, rgba(0, 0, 0, 0.25) 50%, rgba(0, 0, 0, 0.15) 51%, transparent 55%)",
            }}
          ></div>

          {/* ───────────────────────────────────────
              Left Page: The Editor
              ─────────────────────────────────────── */}
          <section className="flex-1 flex flex-col p-6 md:p-12 relative z-0 overflow-y-auto min-h-[500px] border-b md:border-b-0 border-slate-200/50 dark:border-slate-800/50">
            {/* Writer Color Indicator */}
            <div className="absolute left-0 top-12 w-1 h-16 bg-primary rounded-r-full shadow-[2px_0_8px_rgba(236,120,19,0.4)]"></div>

            <div className="max-w-md mx-auto w-full flex flex-col h-full">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 block shrink-0">
                {format(entryDate, "EEEE, MMM d • h:mm a")}
              </span>

              <input
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-3xl font-extrabold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 mb-6 shrink-0"
                placeholder="Entry Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                readOnly={isReadMode}
              />

              {/* Toolbar (Write Mode Only) */}
              {!isReadMode && editor && (
                <div className="flex items-center gap-1 mb-4 py-2 border-y border-slate-200/50 dark:border-slate-700/30 shrink-0 flex-wrap">
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleBold().run();
                    }}
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      editor.isActive("bold")
                        ? "bg-primary/10 text-primary"
                        : "text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleItalic().run();
                    }}
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      editor.isActive("italic")
                        ? "bg-primary/10 text-primary"
                        : "text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleBulletList().run();
                    }}
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      editor.isActive("bulletList")
                        ? "bg-primary/10 text-primary"
                        : "text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleBlockquote().run();
                    }}
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      editor.isActive("blockquote")
                        ? "bg-primary/10 text-primary"
                        : "text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                    title="Quote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const url = window.prompt("Enter URL:");
                      if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                      }
                    }}
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      editor.isActive("link")
                        ? "bg-primary/10 text-primary"
                        : "text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                    title="Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleHeading({ level: 2 }).run();
                    }}
                    className={clsx(
                      "px-2 py-1 rounded-lg text-xs font-bold transition-colors",
                      editor.isActive("heading", { level: 2 })
                        ? "bg-primary/10 text-primary"
                        : "text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                    title="Heading"
                  >
                    H2
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleOrderedList().run();
                    }}
                    className={clsx(
                      "px-2 py-1 rounded-lg text-xs font-bold transition-colors",
                      editor.isActive("orderedList")
                        ? "bg-primary/10 text-primary"
                        : "text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                    title="Numbered List"
                  >
                    1.
                  </button>
                </div>
              )}

              {/* TipTap Editor */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <EditorContent editor={editor} />
              </div>
            </div>
          </section>

          {/* ───────────────────────────────────────
              Right Page: Media & AI Insights
              ─────────────────────────────────────── */}
          <section className="flex-1 flex flex-col p-6 md:p-12 relative z-0 bg-slate-100/50 dark:bg-[#251b14]/50 overflow-y-auto">
            <div className="max-w-md mx-auto w-full flex flex-col gap-8 h-full">
              {/* Media Attachments Area */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments
                </h3>

                {attachments.length === 0 && (
                  <div className="text-sm italic text-slate-400 dark:text-slate-600">
                    No attachments yet. Use the + button to add media.
                  </div>
                )}

                <div className="space-y-4">
                  {attachments.map((att) => (
                    <div key={att.id}>
                      {att.fileType === "image" ? (
                        <div className="group relative rounded-xl overflow-hidden aspect-video shadow-md border border-slate-200 dark:border-slate-800 bg-black/5 dark:bg-black/20">
                          <img
                            className="w-full h-full object-contain"
                            src={att.url}
                            alt="Attachment"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setZoomImage(att.url);
                              }}
                              className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 cursor-zoom-in"
                            >
                              <Maximize className="w-5 h-5" />
                            </button>
                            {!isReadMode && (
                              <button
                                onClick={() =>
                                  handleDeleteAttachment(att.id, att.url)
                                }
                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/80"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-[#322820] p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm group">
                          <button className="size-10 rounded-full bg-primary flex shrink-0 items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Volume2 className="w-5 h-5" />
                          </button>
                          <div className="flex-1 overflow-hidden">
                            <audio
                              controls
                              src={att.url}
                              className="w-full h-8"
                            />
                          </div>
                          {!isReadMode && (
                            <button
                              onClick={() =>
                                handleDeleteAttachment(att.id, att.url)
                              }
                              className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {isUploading && (
                    <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm text-slate-500">
                        Uploading media...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tags
                </h3>
                {!isReadMode ? (
                  <input
                    type="text"
                    placeholder="e.g. mindfulness, morning, thoughts"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tagsInput ? (
                      tagsInput.split(",").map(
                        (tag, i) =>
                          tag.trim() && (
                            <span
                              key={i}
                              className="px-3 py-1 bg-primary/10 rounded-full text-[11px] font-bold text-primary uppercase"
                            >
                              {tag.trim()}
                            </span>
                          ),
                      )
                    ) : (
                      <span className="text-sm text-slate-400 italic">
                        No tags
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Share Mode section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Privacy & Sharing
                </h3>
                <div className="flex bg-slate-100 dark:bg-surface-variant-dark p-1 rounded-xl">
                  {["private", "link", "community"].map((mode) => {
                    const icons = {
                      private: <Lock className="w-4 h-4" />,
                      link: <LinkIcon className="w-4 h-4" />,
                      community: <Globe className="w-4 h-4" />,
                    };
                    return (
                      <button
                        key={mode}
                        disabled={isReadMode}
                        onClick={() => setShareMode(mode)}
                        className={clsx(
                          "flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg text-xs font-bold capitalize transition-all",
                          shareMode === mode
                            ? "bg-white dark:bg-surface-dark shadow-sm text-primary"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                        )}
                      >
                        {icons[mode]}
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mood section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Current Mood
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "happy", icon: Sun, color: "text-amber-500" },
                    { id: "sad", icon: CloudRain, color: "text-blue-500" },
                    { id: "excited", icon: Sparkles, color: "text-yellow-500" },
                    { id: "calm", icon: Waves, color: "text-sky-400" },
                    { id: "anxious", icon: Zap, color: "text-purple-500" },
                    { id: "angry", icon: Flame, color: "text-red-500" },
                    { id: "reflective", icon: Moon, color: "text-indigo-400" },
                    { id: "neutral", icon: Minus, color: "text-slate-400" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      disabled={isReadMode}
                      onClick={() => setMood(m.id)}
                      className={clsx(
                        "p-3 flex items-center justify-center rounded-xl border transition-all",
                        mood === m.id
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
                      )}
                      title={m.id.charAt(0).toUpperCase() + m.id.slice(1)}
                    >
                      <m.icon
                        className={clsx(
                          "w-5 h-5",
                          mood === m.id ? m.color : "text-slate-400",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="mt-auto pt-8 flex gap-3 pb-8 md:pb-0 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() =>
                    toast.success("AI Listen feature coming soon!")
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-600 dark:text-slate-300"
                >
                  <Volume2 className="w-5 h-5" />
                  Listen
                </button>
                <button
                  onClick={() =>
                    toast.success("AI Summary feature coming soon!")
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-600 dark:text-slate-300"
                >
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  Summary
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* =========================================
          Floating Action Buttons
          ========================================= */}
      {!isReadMode && (
        <div className="fixed bottom-10 right-10 flex flex-col items-end gap-4 z-50 group">
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept={ACCEPTED_IMAGE_TYPES}
            onChange={(e) => handleFileUpload(e, "image")}
          />
          <input
            type="file"
            ref={audioInputRef}
            className="hidden"
            accept={ACCEPTED_AUDIO_TYPES}
            onChange={(e) => handleFileUpload(e, "audio")}
          />

          <div className="flex flex-col gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none group-hover:pointer-events-auto">
            <button
              onClick={() => audioInputRef.current?.click()}
              className="size-12 rounded-xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-110"
              title="Add Voice Note"
            >
              <Mic className="w-6 h-6" />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="size-12 rounded-xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-110"
              title="Add Image"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
          </div>

          <button className="size-16 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
            <Plus className="w-8 h-8 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>
      )}

      {/* =========================================
          Share Modal
          ========================================= */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">Share Entry</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex gap-4">
                <div
                  className={clsx(
                    "flex-1 border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors bg-slate-50 dark:bg-surface-variant-dark",
                    shareMode === "community"
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-slate-200 dark:border-slate-800",
                  )}
                  onClick={handleShareToCommunity}
                >
                  <Sparkles className="w-6 h-6 text-primary mb-2" />
                  <h4 className="font-bold text-sm mb-1">Community</h4>
                  <p className="text-xs text-slate-500">
                    Post to the public feed.
                  </p>
                </div>
                <div
                  className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition-colors bg-slate-50 dark:bg-surface-variant-dark"
                  onClick={handleShareToTeam}
                >
                  <BookOpen className="w-6 h-6 text-blue-500 mb-2" />
                  <h4 className="font-bold text-sm mb-1">Notebook</h4>
                  <p className="text-xs text-slate-500">
                    Move to a shared team book.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm mb-3">
                  Share via Secret Link
                </h4>

                {!shareToken ? (
                  <button
                    onClick={handleGenerateShareLink}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-primary/50 text-primary font-semibold hover:bg-primary/5 transition-colors flex justify-center items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Generate Link
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-surface-variant-dark p-3 rounded-xl">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/shared/${shareToken}`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 text-slate-600 dark:text-slate-300"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="p-2 bg-white dark:bg-surface-dark rounded-lg shadow-sm hover:text-primary transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={handleRevokeLink}
                      className="text-xs text-red-500 hover:underline font-medium"
                    >
                      Revoke link and make private
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          Image Zoom Modal
          ========================================= */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <img
            src={zoomImage}
            alt="Zoomed Attachment"
            className="max-w-full max-h-full object-contain select-none animate-in fade-in zoom-in-95 rounded-xl shadow-2xl"
          />
          <button
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setZoomImage(null);
            }}
          >
            <X className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold mb-2">Delete Entry?</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              This action cannot be undone. Are you sure you want to permanently
              delete this entry?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Shadow */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background-light dark:from-background-dark to-transparent pointer-events-none"></div>
    </div>
  );
}
