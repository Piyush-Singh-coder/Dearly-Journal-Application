import { create } from "zustand";
import { axiosInstance } from "./authStore";
import toast from "react-hot-toast";

export const useCommunityStore = create((set, get) => ({
  feed: [],
  comments: [],
  feedPagination: null,
  commentsPagination: null,
  isLoading: false,
  error: null,

  fetchFeed: async (page = 1, sort = "latest") => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(
        `/community/feed?page=${page}&sort=${sort}`,
      );
      set({
        feed: res.data.posts,
        feedPagination: res.data.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error fetching feed",
        isLoading: false,
      });
    }
  },

  handleReaction: async (entryId, type) => {
    // Optimistic Update
    set((state) => ({
      feed: state.feed.map((post) => {
        if (post.entry.id === entryId) {
          const prevReaction = post.entry.userReactionType;
          let newSupportCount = post.entry.reactionCounts.support;
          let newRelateCount = post.entry.reactionCounts.relate;

          // Remove old reaction if switching
          if (prevReaction === "support") newSupportCount--;
          if (prevReaction === "relate") newRelateCount--;

          // Add new reaction
          if (type === "support") newSupportCount++;
          if (type === "relate") newRelateCount++;

          return {
            ...post,
            entry: {
              ...post.entry,
              userReactionType: type,
              reactionCounts: {
                support: newSupportCount,
                relate: newRelateCount,
                total: newSupportCount + newRelateCount,
              },
            },
          };
        }
        return post;
      }),
    }));

    try {
      await axiosInstance.post(`/community/reaction/${entryId}`, { type });
    } catch (error) {
      // Could rollback on failure here if needed
      toast.error(error.response?.data?.message || "Failed to post reaction");
    }
  },

  removeReaction: async (entryId) => {
    // Optimistic Update
    set((state) => ({
      feed: state.feed.map((post) => {
        if (post.entry.id === entryId) {
          const prevReaction = post.entry.userReactionType;
          let newSupportCount = post.entry.reactionCounts.support;
          let newRelateCount = post.entry.reactionCounts.relate;

          if (prevReaction === "support") newSupportCount--;
          if (prevReaction === "relate") newRelateCount--;

          return {
            ...post,
            entry: {
              ...post.entry,
              userReactionType: null,
              reactionCounts: {
                support: newSupportCount,
                relate: newRelateCount,
                total: newSupportCount + newRelateCount,
              },
            },
          };
        }
        return post;
      }),
    }));

    try {
      await axiosInstance.delete(`/community/reaction/${entryId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove reaction");
    }
  },

  shareToCommunity: async (entryId, isAnonymous = true) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post(`/community/share/${entryId}`, {
        isAnonymous,
      });
      set({ isLoading: false });
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error sharing entry",
        isLoading: false,
      });
      throw error;
    }
  },

  unshareFromCommunity: async (entryId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.delete(`/community/share/${entryId}`);
      set((state) => ({
        feed: state.feed.filter((post) => post.entryId !== entryId),
        isLoading: false,
      }));
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error unsharing entry",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchComments: async (entryId, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(
        `/community/comments/${entryId}?page=${page}`,
      );
      set({
        comments: res.data.comments,
        commentsPagination: res.data.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error fetching comments",
        isLoading: false,
      });
    }
  },

  addComment: async (entryId, content) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post(`/community/comment/${entryId}`, {
        content,
      });
      set((state) => ({
        comments: [...state.comments, res.data.comment],
        isLoading: false,
      }));
      return res.data.comment;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error adding comment",
        isLoading: false,
      });
      throw error;
    }
  },
}));
