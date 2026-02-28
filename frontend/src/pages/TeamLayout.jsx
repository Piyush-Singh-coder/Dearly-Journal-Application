import React, { useEffect, useRef, useState, useMemo } from "react";
import BookCover from "../components/BookCover";
import { useNotebookStore } from "../store/notebookStore";
import { useEntryStore } from "../store/entryStore";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  LibraryBig,
  Plus,
  Users,
  Settings,
  LogIn,
  X,
  Loader2,
  ArrowLeft,
  Copy,
  UserPlus,
  Pencil,
  Camera,
  ImagePlus,
  Search,
  Book,
  Globe,
  Lock,
  Clock,
  BookOpen,
  PenLine,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { uploadFile } from "../lib/upload";
import clsx from "clsx";

export default function TeamLayout() {
  const {
    notebooks,
    currentNotebook,
    fetchNotebooks,
    fetchNotebookById,
    createNotebook,
    joinByToken,
    isLoading,
    removeMember,
    inviteMember,
    updateNotebook,
  } = useNotebookStore();

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { notebookId } = useParams();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'private', 'team'

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  useEffect(() => {
    if (notebookId) {
      if (!currentNotebook || currentNotebook.id !== notebookId) {
        fetchNotebookById(notebookId).catch(() => {
          toast.error("Failed to load notebook details");
          navigate("/dashboard/team");
        });
      }
    }
  }, [notebookId, fetchNotebookById, navigate, currentNotebook]);

  const handleOpenNotebook = (id) => {
    navigate(`/dashboard/team/${id}`);
  };

  const handleCloseNotebook = () => {
    navigate("/dashboard/team");
  };

  // Filter logic
  const filteredNotebooks = useMemo(() => {
    let result = notebooks;

    // Sort logic
    if (activeTab === "private") {
      result = result.filter((n) => n.type === "personal");
    } else if (activeTab === "team") {
      result = result.filter((n) => n.type === "team");
    }

    // Search logic
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.description && n.description.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [notebooks, activeTab, searchQuery]);

  // If a notebook is active in the URL, show the Detail View
  if (notebookId && currentNotebook?.id === notebookId) {
    return (
      <NotebookDetailView
        notebook={currentNotebook}
        onClose={handleCloseNotebook}
        onEdit={() => setShowEditModal(true)}
        user={user}
        removeMember={removeMember}
        inviteMember={inviteMember}
        isLoading={isLoading}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        updateNotebook={updateNotebook}
      />
    );
  }

  return (
    <div className="min-h-screen font-display bg-slate-50 dark:bg-surface-dark pb-24">
      {/* ───── HERO BANNER ───── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-white/70 text-sm font-bold uppercase tracking-widest mb-3">
              <LibraryBig className="w-4 h-4" />
              Notebooks
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Your Library
            </h1>
            <p className="text-white/75 text-lg leading-relaxed max-w-md">
              Shelves for your thoughts. Create private notebooks or collaborate
              with friends in shared volumes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:items-end">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 font-bold px-6 py-3.5 rounded-2xl transition-all active:scale-95"
            >
              <LogIn className="w-5 h-5" />
              Join NoteBook
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Book
            </button>
          </div>
        </div>
      </div>

      {/* ───── SEARCH & FILTER BAR ───── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notebooks..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-surface-variant-dark border border-transparent rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-surface-variant-dark rounded-xl p-1 shrink-0">
            {[
              { id: "all", label: "All", icon: Book },
              { id: "private", label: "Private", icon: Lock },
              { id: "team", label: "Shared", icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                }}
                className={clsx(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-white dark:bg-surface-dark shadow-sm text-primary"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200",
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ───── MAIN CONTENT GRID ───── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        {/* Search result badge */}
        {searchQuery && (
          <div className="mb-8 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span className="font-black text-primary">
                {filteredNotebooks.length}
              </span>{" "}
              results for <span className="italic">"{searchQuery}"</span>
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-primary font-bold text-sm hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {isLoading && notebooks.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : filteredNotebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-surface-variant-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <LibraryBig className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              {searchQuery ? "No notebooks found" : "Your shelves are empty"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 text-lg leading-relaxed">
              {searchQuery
                ? "Try a different search term or clear the filters."
                : "Bind your first collection of thoughts together in a new notebook."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Book
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-16 pb-20 justify-items-center">
            {filteredNotebooks.map((notebook, index) => (
              <BookCover
                key={notebook.id}
                notebook={notebook}
                index={index}
                onClick={() => handleOpenNotebook(notebook.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateNotebookModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createNotebook}
        />
      )}
      {showJoinModal && (
        <JoinNotebookModal
          onClose={() => setShowJoinModal(false)}
          onJoin={joinByToken}
        />
      )}
      {/* We normally render Edit modal on the Detail View, but keeping it available globally just in case */}
      {showEditModal && currentNotebook && (
        <EditNotebookModal
          notebook={currentNotebook}
          onClose={() => setShowEditModal(false)}
          onUpdate={updateNotebook}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notebook Detail View (Inside the Book)
// ─────────────────────────────────────────────────────────────────────────────
function NotebookDetailView({
  notebook,
  onClose,
  onEdit,
  user,
  inviteMember,
  showEditModal,
  setShowEditModal,
  updateNotebook,
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const isOwner = notebook.userId === user?.id;

  const { entries, fetchEntries, isLoading: entriesLoading } = useEntryStore();

  useEffect(() => {
    fetchEntries({ notebookId: notebook.id });
  }, [notebook.id, fetchEntries]);

  const handleCopyInvite = () => {
    if (notebook.inviteCode) {
      navigator.clipboard.writeText(notebook.inviteCode);
      toast.success("Invite code copied!");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      await inviteMember(notebook.id, inviteEmail);
      toast.success("Invite sent!");
      setInviteEmail("");
    } catch {
      toast.error("Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-dark animate-in fade-in duration-300 relative font-display pb-24">
      {/* Detail View Sub-header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold group"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Back to Library
          </button>
          {isOwner && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-slate-100 dark:bg-surface-variant-dark hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN: Meta & Collaborators */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          {/* Notebook Info Card */}
          <div className="bg-white dark:bg-surface-variant-dark rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8"></div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-5 bg-white/50 dark:bg-surface-dark/50 backdrop-blur-sm">
              {notebook.type === "team" ? (
                <Users className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              {notebook.type === "team" ? "Shared Volume" : "Private Journal"}
            </div>

            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 relative z-10 leading-tight">
              {notebook.title}
            </h1>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed relative z-10 mb-6 font-medium text-sm">
              {notebook.description ||
                "No description provided. This is a quiet space for your thoughts."}
            </p>

            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Est. {format(new Date(notebook.createdAt), "MMM yyyy")}
            </div>
          </div>

          {/* Collaborators Card */}
          {notebook.type === "team" && (
            <div className="bg-white dark:bg-surface-variant-dark rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-black mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="w-5 h-5 text-primary" />
                Collaborators
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {isOwner ? "ME" : "OW"}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">
                        {isOwner ? "You" : "Creator"}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Owner
                      </span>
                    </div>
                  </div>
                </div>
                {/* Normally we map members here */}
              </div>

              {isOwner && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                    Add Members
                  </h4>

                  <form onSubmit={handleInvite} className="flex gap-2 mb-4">
                    <input
                      type="email"
                      placeholder="Email address..."
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isInviting || !inviteEmail}
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center shadow-lg shadow-primary/20"
                    >
                      {isInviting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Invite"
                      )}
                    </button>
                  </form>

                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-surface-dark p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      readOnly
                      value={notebook.inviteCode || "No invite code"}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm pl-2 text-slate-600 dark:text-slate-400 font-mono"
                    />
                    <button
                      onClick={handleCopyInvite}
                      className="p-2 bg-white dark:bg-surface-variant-dark hover:text-primary dark:hover:text-primary rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Entries Grid */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-slate-400" />
              Contents
            </h2>
            <button
              onClick={() =>
                (window.location.href = `/dashboard/entry/new?notebookId=${notebook.id}`)
              }
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-all"
            >
              <Pencil className="w-4 h-4" />
              Write Entry
            </button>
          </div>

          <div className="flex-1 relative">
            {entriesLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-white dark:bg-surface-variant-dark rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PenLine className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Pages are blank
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-6">
                  Create the first entry in this notebook to start filling its
                  pages.
                </p>
                <button
                  onClick={() =>
                    (window.location.href = `/dashboard/entry/new?notebookId=${notebook.id}`)
                  }
                  className="bg-primary/10 text-primary font-bold px-6 py-2.5 rounded-xl hover:bg-primary/20 transition-colors"
                >
                  Start Writing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/dashboard/entry/${entry.id}`}
                    className="bg-white dark:bg-surface-variant-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all group flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(entry.createdAt), "MMM d")}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {entry.title || "Untitled Entry"}
                    </h3>
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        Updated {formatDistanceToNow(new Date(entry.updatedAt))}
                      </span>
                      <ArrowLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:rotate-180 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal Rendered Locally */}
      {showEditModal && (
        <EditNotebookModal
          notebook={notebook}
          onClose={() => setShowEditModal(false)}
          onUpdate={updateNotebook}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modals (Create & Join & Edit)
// ─────────────────────────────────────────────────────────────────────────────

function CreateNotebookModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("personal");
  const [coverImage, setCoverImage] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const coverInputRef = useRef(null);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Please select an image file.");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image must be smaller than 5MB.");

    setIsUploadingCover(true);
    try {
      const publicUrl = await uploadFile(file, "covers");
      setCoverImage(publicUrl);
    } catch {
      toast.error("Upload failed.");
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    setIsSubmitting(true);
    try {
      await onCreate({ title, description, type, coverImage });
      onClose();
    } catch {
      toast.error("Failed to create book");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-surface-variant-dark/30 rounded-t-3xl">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> New Book
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Cover upload */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">
              Cover Art
            </label>
            <div
              className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer bg-slate-100 dark:bg-surface-variant-dark hover:ring-2 hover:ring-primary/40 transition-all flex items-center justify-center group"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-sm font-bold">Upload an image</span>
                </div>
              )}
              {isUploadingCover && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin mb-1" />
                  <span className="text-xs font-bold">Uploading...</span>
                </div>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Travel Journal"
              className="w-full bg-slate-50 dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What goes in this book?"
              rows="2"
              className="w-full bg-slate-50 dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">
              Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("personal")}
                className={clsx(
                  "p-3 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all",
                  type === "personal"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                <Lock className="w-4 h-4" /> Private
              </button>
              <button
                type="button"
                onClick={() => setType("team")}
                className={clsx(
                  "p-3 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all",
                  type === "team"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                <Users className="w-4 h-4" /> Shared
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-primary-dark transition-all mt-2 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Book"}
          </button>
        </form>
      </div>
    </div>
  );
}

function JoinNotebookModal({ onClose, onJoin }) {
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return toast.error("Invite token is required");
    setIsSubmitting(true);
    try {
      await onJoin(token);
      toast.success("Joined notebook!");
      onClose();
    } catch {
      toast.error("Invalid or expired token");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-surface-variant-dark/30 rounded-t-3xl">
          <h3 className="text-xl font-black flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" /> Join Book
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="text-sm text-slate-500 mb-2">
            Paste the invite code shared with you by the notebook owner.
          </p>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder="e.g. abc-123-xyz"
            className="w-full bg-slate-50 dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono focus:border-primary outline-none text-center tracking-widest uppercase"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-primary-dark transition-all mt-2 disabled:opacity-50"
          >
            {isSubmitting ? "Joining..." : "Join Notebook"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditNotebookModal({ notebook, onClose, onUpdate }) {
  const [title, setTitle] = useState(notebook.title);
  const [description, setDescription] = useState(notebook.description || "");
  const [coverImage, setCoverImage] = useState(notebook.coverImage || "");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const coverInputRef = useRef(null);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const publicUrl = await uploadFile(file, "covers");
      setCoverImage(publicUrl);
    } catch {
      toast.error("Upload failed.");
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdate(notebook.id, { title, description, coverImage });
      onClose();
    } catch {
      toast.error("Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-surface-variant-dark/30 rounded-t-3xl">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Settings
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">
              Cover Art
            </label>
            <div
              className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-slate-400" />
                </div>
              )}
              {isUploadingCover && (
                <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="2"
              className="w-full bg-slate-50 dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl shadow-lg hover:opacity-90 transition-all mt-2"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
