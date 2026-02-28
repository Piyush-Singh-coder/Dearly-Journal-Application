import { create } from "zustand";
import { axiosInstance } from "./authStore";

export const useEntryStore = create((set) => ({
  entries: [],
  currentEntry: null,
  pagination: null,
  loadingCount: 0,
  isLoading: false,
  error: null,

  fetchEntries: async (filters = {}) => {
    set((state) => ({
      loadingCount: state.loadingCount + 1,
      isLoading: true,
      error: null,
    }));
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axiosInstance.get(`/entries?${queryParams}`);
      set({
        entries: res.data.entries,
        pagination: res.data.pagination,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error fetching entries",
      });
      throw error;
    } finally {
      set((state) => {
        const count = Math.max(0, state.loadingCount - 1);
        return { loadingCount: count, isLoading: count > 0 };
      });
    }
  },

  fetchEntryById: async (id, shareToken = null) => {
    set((state) => ({
      loadingCount: state.loadingCount + 1,
      isLoading: true,
      error: null,
    }));
    try {
      const url = shareToken
        ? `/entries/${id}?shareToken=${shareToken}`
        : `/entries/${id}`;
      const res = await axiosInstance.get(url);
      set({ currentEntry: res.data.entry });
      return res.data.entry;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error fetching entry",
      });
      throw error;
    } finally {
      set((state) => {
        const count = Math.max(0, state.loadingCount - 1);
        return { loadingCount: count, isLoading: count > 0 };
      });
    }
  },

  createEntry: async (data) => {
    set((state) => ({
      loadingCount: state.loadingCount + 1,
      isLoading: true,
      error: null,
    }));
    try {
      const res = await axiosInstance.post("/entries", data);
      set((state) => ({
        entries: [res.data.entry, ...state.entries],
        pagination: state.pagination
          ? { ...state.pagination, total: state.pagination.total + 1 }
          : null,
      }));
      return res.data.entry;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error creating entry",
      });
      throw error;
    } finally {
      set((state) => {
        const count = Math.max(0, state.loadingCount - 1);
        return { loadingCount: count, isLoading: count > 0 };
      });
    }
  },

  updateEntry: async (id, data) => {
    set((state) => ({
      loadingCount: state.loadingCount + 1,
      isLoading: true,
      error: null,
    }));
    try {
      const res = await axiosInstance.put(`/entries/${id}`, data);
      set((state) => ({
        entries: state.entries.map((entry) =>
          String(entry.id) === String(id) ? res.data.entry : entry,
        ),
        currentEntry:
          state.currentEntry && String(state.currentEntry.id) === String(id)
            ? res.data.entry
            : state.currentEntry,
      }));
      return res.data.entry;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error updating entry",
      });
      throw error;
    } finally {
      set((state) => {
        const count = Math.max(0, state.loadingCount - 1);
        return { loadingCount: count, isLoading: count > 0 };
      });
    }
  },

  duplicateEntry: async (id) => {
    set((state) => ({
      loadingCount: state.loadingCount + 1,
      isLoading: true,
      error: null,
    }));
    try {
      const res = await axiosInstance.post(`/entries/${id}/duplicate`);
      set((state) => ({
        entries: [res.data.entry, ...state.entries],
        pagination: state.pagination
          ? { ...state.pagination, total: state.pagination.total + 1 }
          : null,
      }));
      return res.data.entry;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error duplicating entry",
      });
      throw error;
    } finally {
      set((state) => {
        const count = Math.max(0, state.loadingCount - 1);
        return { loadingCount: count, isLoading: count > 0 };
      });
    }
  },

  deleteEntry: async (id) => {
    set((state) => ({
      loadingCount: state.loadingCount + 1,
      isLoading: true,
      error: null,
    }));
    try {
      await axiosInstance.delete(`/entries/${id}`);
      set((state) => ({
        entries: state.entries.filter(
          (entry) => String(entry.id) !== String(id),
        ),
        currentEntry:
          state.currentEntry && String(state.currentEntry.id) === String(id)
            ? null
            : state.currentEntry,
        pagination: state.pagination
          ? {
              ...state.pagination,
              total: Math.max(0, state.pagination.total - 1),
            }
          : null,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error deleting entry",
      });
      throw error;
    } finally {
      set((state) => {
        const count = Math.max(0, state.loadingCount - 1);
        return { loadingCount: count, isLoading: count > 0 };
      });
    }
  },

  // ─────────── Attachments ───────────

  addAttachment: async (entryId, { url, fileType }) => {
    try {
      const res = await axiosInstance.post(`/entries/${entryId}/attachments`, {
        url,
        fileType,
      });
      return res.data.attachment;
    } catch (error) {
      console.error("Add attachment error:", error);
      throw error;
    }
  },

  getAttachments: async (entryId) => {
    try {
      const res = await axiosInstance.get(`/entries/${entryId}/attachments`);
      return res.data.attachments;
    } catch (error) {
      console.error("Get attachments error:", error);
      throw error;
    }
  },

  deleteAttachment: async (entryId, attachmentId) => {
    try {
      await axiosInstance.delete(
        `/entries/${entryId}/attachments/${attachmentId}`,
      );
    } catch (error) {
      console.error("Delete attachment error:", error);
      throw error;
    }
  },

  // ─────────── Share Link ───────────

  generateShareLink: async (entryId) => {
    try {
      const res = await axiosInstance.put(`/entries/${entryId}`, {
        shareMode: "link",
      });
      const entry = res.data.entry;
      // Update local entries list
      set((state) => ({
        entries: state.entries.map((e) =>
          String(e.id) === String(entryId) ? entry : e,
        ),
        currentEntry:
          state.currentEntry &&
          String(state.currentEntry.id) === String(entryId)
            ? entry
            : state.currentEntry,
      }));
      return entry;
    } catch (error) {
      console.error("Generate share link error:", error);
      throw error;
    }
  },

  revokeShareLink: async (entryId) => {
    try {
      const res = await axiosInstance.put(`/entries/${entryId}`, {
        shareMode: "private",
      });
      const entry = res.data.entry;
      set((state) => ({
        entries: state.entries.map((e) =>
          String(e.id) === String(entryId) ? entry : e,
        ),
        currentEntry:
          state.currentEntry &&
          String(state.currentEntry.id) === String(entryId)
            ? entry
            : state.currentEntry,
      }));
      return entry;
    } catch (error) {
      console.error("Revoke share link error:", error);
      throw error;
    }
  },
}));
