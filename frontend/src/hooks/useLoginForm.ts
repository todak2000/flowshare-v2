"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { handleApiError, type AppError } from "@/lib/error-handler";
import { normalizeEmail } from "@/lib/validation";

// Helper function from your original component
const checkIsFirstLogin = (userData: any): boolean => {
  const newRegistration = sessionStorage.getItem("newRegistration");
  if (newRegistration === "true") {
    sessionStorage.removeItem("newRegistration");
    return true;
  }
  if (!userData.last_login_at) return true;
  const createdAt = new Date(userData.created_at);
  const lastLoginAt = new Date(userData.last_login_at);
  const diffInSeconds = Math.abs(
    (lastLoginAt.getTime() - createdAt.getTime()) / 1000
  );
  return diffInSeconds < 10;
};

export function useLoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedEmail = normalizeEmail(email);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );
      const idToken = await userCredential.user.getIdToken();
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      let userData;
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        userData = response.data;
      } catch (apiError: any) {
        if (apiError.response?.status === 404) {
          setError({
            title: "Account Not Set Up",
            message:
              "Your account exists in Firebase but is not yet registered in FlowShare.",
            action:
              "Please complete the registration process to set up your account.",
            code: "404",
          });
          return;
        } else {
          throw apiError;
        }
      }

      if (userData) setUser(userData);
      const isFirstLogin = checkIsFirstLogin(userData);

      if (isFirstLogin) {
        if (["coordinator", "partner"].includes(userData.role)) {
          router.push("/dashboard/team?welcome=true");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.length > 0 && password.length > 0 && emailValid;

  return {
    email,
    setEmail,
    password,
    setPassword,
    emailValid,
    setEmailValid,
    error,
    setError,
    loading,
    handleLogin,
    canSubmit,
  };
}