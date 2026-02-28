import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCommunityStore } from "../store/communityStore";
import { useAuthStore } from "../store/authStore";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import {
  Heart,
  MessageCircle,
  Share2,
  Globe,
  Clock,
  User as UserIcon,
  Loader2,
  X,
  Sparkles,
  ThumbsUp,
  MessageSquare,
  Search,
  TrendingUp,
  Flame,
  Star,
  PenLine,
  ChevronRight,
  Filter,
} from "lucide-react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
function stripHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

const SORT_TABS = [
  { id: "latest", label: "Latest", icon: Clock },
  { id: "trending", label: "Trending", icon: TrendingUp },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CommunityFeed() {
  const { feed, fetchFeed, isLoading, handleReaction, removeReaction } =
    useCommunityStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchFeed(1, activeTab);
  }, [fetchFeed, activeTab]);

  const onReactionClick = async (postId, type, hasReacted) => {
    try {
      if (hasReacted) {
        await removeReaction(postId);
      } else {
        await handleReaction(postId, type);
      }
    } catch {
      // error handled in store
    }
  };

  // Client-side search filter
  const filteredFeed = useMemo(() => {
    if (!searchQuery.trim()) return feed;
    const q = searchQuery.toLowerCase();
    return feed.filter(
      (post) =>
        post.entry?.title?.toLowerCase().includes(q) ||
        stripHtml(post.entry?.content).toLowerCase().includes(q),
    );
  }, [feed, searchQuery]);

  // Derive a simple "trending" top-3 by reaction count for the sidebar
  const trendingPosts = useMemo(
    () =>
      [...feed]
        .sort(
          (a, b) =>
            (b.entry.reactionCounts?.support || 0) +
            (b.entry.reactionCounts?.relate || 0) -
            ((a.entry.reactionCounts?.support || 0) +
              (a.entry.reactionCounts?.relate || 0)),
        )
        .slice(0, 3),
    [feed],
  );

  return (
    <div className="min-h-screen font-display bg-slate-50 dark:bg-surface-dark pb-24">
      {/* ───── HERO BANNER ───── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-indigo-600 text-white">
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
              <Globe className="w-4 h-4" />
              Community Feed
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Stories that
              <br />
              <span className="text-amber-300">connect us all</span>
            </h1>
            <p className="text-white/75 text-lg leading-relaxed max-w-md">
              A safe space to share your thoughts anonymously. Read, relate, and
              support others on their journey.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 bg-white text-primary font-bold px-6 py-3.5 rounded-2xl shadow-xl hover:shadow-white/20 transition-all active:scale-95"
            >
              <PenLine className="w-5 h-5" />
              Share to Community
            </button>
            <div className="flex items-center gap-4 text-white/60 text-sm font-bold">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                {feed.length} posts today
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                Anonymous & safe
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ───── SEARCH & FILTER BAR ───── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-col sm:flex-row  items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-surface-variant-dark border border-transparent rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
            {SORT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                }}
                className={clsx(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-white dark:bg-surface-dark shadow-sm text-primary"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200",
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ───── MAIN CONTENT GRID ───── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Left: Feed */}
        <main>
          {/* Search result badge */}
          {searchQuery && (
            <div className="mb-6 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span className="font-black text-primary">
                  {filteredFeed.length}
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

          {isLoading && feed.length === 0 ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="text-center py-24 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">
                {searchQuery ? "No results found" : "The community is quiet"}
              </h3>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                {searchQuery
                  ? "Try a different search term."
                  : "Be the first to share your thoughts."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredFeed.map((post, idx) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  user={user}
                  isFeatured={
                    idx === 0 && !searchQuery && activeTab === "trending"
                  }
                  onReactionClick={onReactionClick}
                  onCommentClick={() => setActiveCommentPost(post)}
                />
              ))}

              {/* End of feed */}
              {!searchQuery && (
                <div className="py-16 flex flex-col items-center text-slate-400">
                  <Globe className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-bold tracking-widest uppercase opacity-50">
                    You've reached the end
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right: Sidebar */}
        <aside className="hidden lg:flex flex-col gap-6">
          {/* Community Stats */}
          <div className="bg-white dark:bg-surface-variant-dark rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 mb-4">
              Community Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Total Posts
                </span>
                <span className="font-black text-slate-900 dark:text-white">
                  {feed.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Total Reactions
                </span>
                <span className="font-black text-primary">
                  {feed.reduce(
                    (acc, p) =>
                      acc +
                      (p.entry.reactionCounts?.support || 0) +
                      (p.entry.reactionCounts?.relate || 0),
                    0,
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Total Comments
                </span>
                <span className="font-black text-slate-900 dark:text-white">
                  {feed.reduce(
                    (acc, p) => acc + (p.entry._count?.comments || 0),
                    0,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Trending */}
          {trendingPosts.length > 0 && (
            <div className="bg-white dark:bg-surface-variant-dark rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" /> Hot Right Now
              </h3>
              <div className="space-y-3">
                {trendingPosts.map((post, i) => (
                  <div
                    key={post.id}
                    onClick={() => setActiveCommentPost(post)}
                    className="group cursor-pointer flex gap-3 items-start"
                  >
                    <span className="text-2xl font-black text-slate-200 dark:text-slate-700 mt-0.5 w-6 shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                        {post.entry.title || "Untitled"}
                      </p>
                      <div className="flex gap-3 mt-1 text-xs text-slate-400 font-semibold">
                        <span className="flex items-center gap-0.5">
                          <ThumbsUp className="w-3 h-3" />
                          {post.entry.reactionCounts?.support || 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-3 h-3" />
                          {post.entry.reactionCounts?.relate || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share CTA */}
          <div className="bg-linear-to-br from-primary/10 to-indigo-500/10 rounded-2xl p-5 border border-primary/20 text-center">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
            <h4 className="font-black mb-1">Share Your Story</h4>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Your words might help someone feel less alone.
            </p>
            <button
              onClick={() => setShowShareModal(true)}
              className="w-full bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              Share Anonymously
            </button>
          </div>
        </aside>
      </div>

      {/* Modals */}
      {activeCommentPost && (
        <CommentModal
          post={activeCommentPost}
          onClose={() => setActiveCommentPost(null)}
        />
      )}
      {showShareModal && (
        <ShareModal onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Post Card
// ─────────────────────────────────────────────────────────────────────────────
function CommunityPostCard({
  post,
  user,
  onReactionClick,
  onCommentClick,
  isFeatured,
}) {
  const entry = post.entry;
  const supportCount = entry.reactionCounts?.support || 0;
  const relateCount = entry.reactionCounts?.relate || 0;
  const commentsCount = entry._count?.comments || 0;
  const hasReactedSupport = entry.userReactionType === "support";
  const hasReactedRelate = entry.userReactionType === "relate";
  const preview = stripHtml(entry.content);

  return (
    <article
      className={clsx(
        "bg-white dark:bg-surface-dark rounded-2xl border transition-all group hover:shadow-lg hover:border-primary/20",
        isFeatured
          ? "border-amber-200 dark:border-amber-500/20 shadow-md ring-1 ring-amber-200 dark:ring-amber-500/20"
          : "border-slate-200 dark:border-slate-800 shadow-sm",
      )}
    >
      {isFeatured && (
        <div className="px-6 pt-4 pb-0 flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Flame className="w-3.5 h-3.5" /> Top Story
        </div>
      )}

      <div className="p-6">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-indigo-500/30 flex items-center justify-center shrink-0">
            <UserIcon className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-bold text-slate-500">Anonymous</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Title & Body */}
        <div className="cursor-pointer" onClick={onCommentClick}>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {entry.title || "Untitled"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 text-[15px]">
            {preview}
          </p>
          <p className="mt-2 text-xs text-primary font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Read more <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            <button
              onClick={() =>
                onReactionClick(entry.id, "support", hasReactedSupport)
              }
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all border active:scale-95",
                hasReactedSupport
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary hover:text-primary",
              )}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{supportCount}</span>
            </button>
            <button
              onClick={() =>
                onReactionClick(entry.id, "relate", hasReactedRelate)
              }
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all border active:scale-95",
                hasReactedRelate
                  ? "bg-rose-500/10 border-rose-400 text-rose-500"
                  : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:border-rose-400 hover:text-rose-500",
              )}
            >
              <Heart className="w-4 h-4" />
              <span>{relateCount}</span>
            </button>
          </div>

          <button
            onClick={onCommentClick}
            className="flex items-center gap-1.5 text-slate-500 hover:text-primary font-bold text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>
              {commentsCount > 0 ? commentsCount : ""} Comment
              {commentsCount !== 1 ? "s" : ""}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comment Modal
// ─────────────────────────────────────────────────────────────────────────────
function CommentModal({ post, onClose }) {
  const { comments, fetchComments, addComment, isLoading } =
    useCommunityStore();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasReacted = !!post.entry.userReactionType;

  useEffect(() => {
    fetchComments(post.entry.id);
  }, [fetchComments, post.entry.id]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment(post.entry.id, text);
      toast.success("Comment added anonymously");
      setText("");
    } catch (error) {
      toast.error(error.message || "Failed to add comment. React first!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-surface-dark w-full max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h4
            className="text-xl font-black truncate pr-4 text-slate-900 dark:text-white"
            title={post.entry.title}
          >
            {post.entry.title}
          </h4>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 sm:p-8 shrink-0">
            <div
              className="ProseMirror text-slate-700 dark:text-slate-300 text-[1.05rem] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.entry.content }}
            />
          </div>

          <div className="px-4 sm:px-8 py-3 bg-slate-50 dark:bg-surface-variant-dark/30 border-y border-slate-100 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
            <h3 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({comments.length})
            </h3>
          </div>

          <div className="flex-1 p-4 sm:p-8 space-y-4 bg-slate-50/50 dark:bg-surface-variant-dark/10">
            {isLoading && comments.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No comments yet. Be the first!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white dark:bg-surface-variant-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      Anonymous
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-surface-dark relative">
          {!hasReacted && (
            <div className="absolute inset-0 z-10 bg-white/70 dark:bg-surface-dark/70 backdrop-blur-[2px] flex items-center justify-center pointer-events-none rounded-b-3xl">
              <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-full text-sm font-bold shadow border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                React to the post first to comment
              </span>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!hasReacted}
            className="w-full bg-slate-50 dark:bg-surface-variant-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-h-[90px] max-h-[150px] text-sm text-slate-800 dark:text-slate-200 resize-y mb-3 transition-all disabled:opacity-50"
            placeholder={
              hasReacted
                ? "Write something meaningful..."
                : "React to the post first"
            }
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Posted anonymously
            </p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !text.trim() || !hasReacted}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-full font-bold hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Post"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Share Modal
// ─────────────────────────────────────────────────────────────────────────────
function ShareModal({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-black mb-2">Share to Community</h3>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Open any entry from your Personal Journal and set the Share mode to{" "}
          <strong>Community</strong> to publish it here — anonymously.
        </p>
        <button
          onClick={() => {
            onClose();
            navigate("/dashboard");
          }}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          Go to My Journal
        </button>
        <button
          onClick={onClose}
          className="mt-4 font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
