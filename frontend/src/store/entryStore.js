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
}));
