import { create } from "zustand";
import { axiosInstance } from "./authStore";

export const useCommunityStore = create((set, get) => ({
  feed: [],
  comments: [],
  feedPagination: null,
  commentsPagination: null,
  isLoading: false,
  error: null,

  fetchFeed: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(`/community/feed?page=${page}`);
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
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(`/community/reaction/${entryId}`, { type });
      await get().fetchFeed(get().feedPagination?.currentPage || 1);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error posting reaction",
        isLoading: false,
      });
      throw error;
    }
  },

  removeReaction: async (entryId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/community/reaction/${entryId}`);
      await get().fetchFeed(get().feedPagination?.currentPage || 1);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error removing reaction",
        isLoading: false,
      });
      throw error;
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
