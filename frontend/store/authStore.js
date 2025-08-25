import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  register: async (name, email, password) => {
    console.log(name, email, password);
    set({ isLoading: true });
    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await response.json();
      console.log(data);

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
      console.log(error);
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
      const response = await fetch("http://localhost:3000/api/v1/auth/google", {
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
    set({ isLoading: true });
    try {
      const response = await fetch("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");
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
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    set({ user: null, token: null });
  },

  forgotPassword: async (email) => {
    set({ isLoading: true });
    console.log("auth provider forgotPassword:", email);
    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
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
    console.log(token);
    console.log(newPassword);
    set({ isLoading: true });
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: newPassword }),
        }
      );
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
