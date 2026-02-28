import { create } from "zustand";
import axios from "axios";
import { supabase } from "../lib/supabase";

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
    // Do NOT touch global isLoading — App.jsx would unmount AuthPage mid-flight,
    // wiping local state (verificationEmail) before it can show.
    const res = await axiosInstance.post("/auth/register", userData);
    return res.data;
  },

  login: async (credentials) => {
    set({ error: null });
    try {
      const res = await axiosInstance.post("/auth/login", credentials);
      localStorage.setItem("token", res.data.token);
      set({
        user: res.data.user,
        isAuthenticated: true,
        token: res.data.token,
      });
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error logging in",
      });
      throw error;
    }
  },

  googleLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Trigger Supabase Google OAuth popup
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
      // Redirect is handled by Supabase — the flow continues in AuthCallback
    } catch (error) {
      set({
        error: error.message || "Google sign-in failed",
        isLoading: false,
      });
      throw error;
    }
  },

  // Called by AuthCallback after the OAuth redirect with the Supabase session
  loginWithSupabaseSession: async (access_token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post("/auth/google", { access_token });
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
        error: error.response?.data?.message || "Google authentication failed",
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.log(error.response.data.message);
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
      console.log(error.response?.data?.message || "Auth error");
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.put("/auth/profile", data);
      set({ user: res.data.user, isLoading: false });
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update profile",
        isLoading: false,
      });
      throw error;
    }
  },

  updateSettings: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.put("/auth/settings", data);
      set((state) => ({
        user: { ...state.user, settings: res.data.settings },
        isLoading: false,
      }));
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update settings",
        isLoading: false,
      });
      throw error;
    }
  },

  changePassword: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.put("/auth/change-password", data);
      set({ isLoading: false });
      return res.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to change password",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete("/auth/account");
      localStorage.removeItem("token");
      set({
        user: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete account",
        isLoading: false,
      });
      throw error;
    }
  },

  verifyEmail: async (token) => {
    const res = await axiosInstance.get(`/auth/verify-email?token=${token}`);
    return res.data;
  },
}));
