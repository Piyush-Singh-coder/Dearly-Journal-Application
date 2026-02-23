import { create } from "zustand";
import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// Add interceptor to attach JWT token to all requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  token: localStorage.getItem("token") || null,

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post("/auth/register", userData);
      localStorage.setItem("token", res.data.token);
      set({
        user: res.data.user,
        isAuthenticated: true,
        token: res.data.token,
        isLoading: false,
      });
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error signing up",
        isLoading: false,
      });
      throw error;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post("/auth/login", credentials);
      localStorage.setItem("token", res.data.token);
      set({
        user: res.data.user,
        isAuthenticated: true,
        token: res.data.token,
        isLoading: false,
      });
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error logging in",
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (_) {
      // Even if the server call fails, still clear local state
    }
    localStorage.removeItem("token");
    set({ user: null, isAuthenticated: false, token: null });
  },

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    const token = localStorage.getItem("token");
    if (!token) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      });
      return;
    }
    try {
      const res = await axiosInstance.get("/auth/profile");
      set({
        user: res.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem("token");
      set({
        user: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
        error: null,
      });
    }
  },

  verifyEmail: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(`/auth/verify-email?token=${token}`);
      set({ isLoading: false });
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error verifying email",
        isLoading: false,
      });
      throw error;
    }
  },
}));
