import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContactStore } from "./contactStore";
import { Platform } from "react-native";

const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000" // Android emulator
    : "http://192.168.1.238:3000"; // iOS / Web / physical devices

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  updateProfileImage: async (imageUri) => {
    const { token, user } = get();

    try {
      const formData = new FormData();
      formData.append("profileImage", {
        uri: imageUri,
        name: "profile.jpg",
        type: "image/jpeg",
      });

      const response = await fetch(`${API_URL}/api/v1/users/profile-image`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`, // if your API uses JWT auth
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to update image");

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user });

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Update profile image failed:", error);
      return { success: false, error: error.message };
    }
  },
  
  setUser: async (user) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(user));
      set({ user });
    } catch (err) {
      console.error("Failed to persist user:", err);
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Something went wrong");

      // Defensive: check for missing fields
      if (!data.user || !data.token)
        throw new Error("Missing user or token in response");

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);
      set({ token: data.token, user: data.user, isLoading: false });

      return { success: true, user: data.user, token: data.token };
    } catch (error) {
      set({ isLoading: false });
      console.error(error);
      return { success: false, message: error.message };
    }
  },
  googleLogin: async () => {
    set({ isLoading: true });
    try {
      // This will be implemented in your component
      // The actual authentication flow happens there
      // This function just handles the backend part
      return { success: false, error: "Not implemented in store yet" };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Add function to handle Google auth response
  handleGoogleAuth: async (accessToken) => {
    set({ isLoading: true });
    try {
      // Send the Google access token to your backend
      const response = await fetch(`${API_URL}/api/v1/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Google authentication failed");

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);
      set({ token: data.token, user: data.user, isLoading: false });

      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  login: async (email, password) => {
    set({ user: null, token: null });
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      // Save user/token
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);
      set({ token: data.token, user: data.user, isLoading: false });

      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userjson = await AsyncStorage.getItem("user");

      const user = userjson ? JSON.parse(userjson) : null;

      set({ token, user });
    } catch (error) {
      console.error("Auth check failed", error);
    }
  },

  logout: async () => {
    set({ user: null, token: null });
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
  },

  forgotPassword: async (email) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Password reset request failed");

      set({ isLoading: false });
      return {
        success: true,
        message: data.message || "Password reset email sent.",
      };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },
  resetPassword: async (token, newPassword) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Password reset failed");

      set({ isLoading: false });
      return {
        success: true,
        message: data.message || "Password has been reset successfully.",
      };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },
}));
