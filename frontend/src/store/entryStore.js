import { create } from "zustand";
import { axiosInstance } from "./authStore";

export const useEntryStore = create((set, get) => ({
  entries: [],
  currentEntry: null,
  pagination: null,
  isLoading: false,
  error: null,

  fetchEntries: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axiosInstance.get(`/entries?${queryParams}`);
      set({
        entries: res.data.entries,
        pagination: res.data.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error fetching entries",
        isLoading: false,
      });
    }
  },

  fetchEntryById: async (id, shareToken = null) => {
    set({ isLoading: true, error: null });
    try {
      const url = shareToken
        ? `/entries/${id}?shareToken=${shareToken}`
        : `/entries/${id}`;
      const res = await axiosInstance.get(url);
      set({ currentEntry: res.data.entry, isLoading: false });
      return res.data.entry;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error fetching entry",
        isLoading: false,
      });
      throw error;
    }
  },

  createEntry: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post("/entries", data);
      set((state) => ({
        entries: [res.data.entry, ...state.entries],
        isLoading: false,
      }));
      return res.data.entry;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error creating entry",
        isLoading: false,
      });
      throw error;
    }
  },

  updateEntry: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.put(`/entries/${id}`, data);
      set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? res.data.entry : entry,
        ),
        currentEntry:
          state.currentEntry?.id === id ? res.data.entry : state.currentEntry,
        isLoading: false,
      }));
      return res.data.entry;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error updating entry",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/entries/${id}`);
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error deleting entry",
        isLoading: false,
      });
      throw error;
    }
  },
}));
