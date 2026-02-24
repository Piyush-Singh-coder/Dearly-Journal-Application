import { create } from "zustand";
import { axiosInstance } from "./authStore";

export const useNotebookStore = create((set, get) => ({
  notebooks: [],
  currentNotebook: null,
  isLoading: false,
  error: null,

  fetchNotebooks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/notebooks");
      set({ notebooks: res.data.notebooks, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error fetching notebooks",
        isLoading: false,
      });
    }
  },

  fetchNotebookById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(`/notebooks/${id}`);
      set({ currentNotebook: res.data.notebook, isLoading: false });
      return res.data.notebook;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Error fetching notebook details",
        isLoading: false,
      });
      throw error;
    }
  },

  createNotebook: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post("/notebooks", data);
      set((state) => ({
        notebooks: [res.data.notebook, ...state.notebooks],
        isLoading: false,
      }));
      return res.data.notebook;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error creating notebook",
        isLoading: false,
      });
      throw error;
    }
  },

  updateNotebook: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.put(`/notebooks/${id}`, data);
      set((state) => ({
        notebooks: state.notebooks.map((nb) =>
          nb.id === id ? res.data.notebook : nb,
        ),
        currentNotebook:
          state.currentNotebook?.id === id
            ? res.data.notebook
            : state.currentNotebook,
        isLoading: false,
      }));
      return res.data.notebook;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error updating notebook",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteNotebook: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/notebooks/${id}`);
      set((state) => ({
        notebooks: state.notebooks.filter((nb) => nb.id !== id),
        currentNotebook:
          state.currentNotebook?.id === id ? null : state.currentNotebook,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error deleting notebook",
        isLoading: false,
      });
      throw error;
    }
  },

  inviteMember: async (id, email) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post(`/notebooks/${id}/invite`, {
        email,
      });
      set({ isLoading: false });
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error sending invite",
        isLoading: false,
      });
      throw error;
    }
  },

  joinByToken: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post(`/notebooks/join/${token}`);
      // Refresh notebooks after joining
      await get().fetchNotebooks();
      set({ isLoading: false });
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error joining notebook",
        isLoading: false,
      });
      throw error;
    }
  },

  removeMember: async (notebookId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/notebooks/${notebookId}/members/${userId}`);
      // Refresh notebook detail
      if (get().currentNotebook?.id === notebookId) {
        await get().fetchNotebookById(notebookId);
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error removing member",
        isLoading: false,
      });
      throw error;
    }
  },
}));
