"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { handleApiError, type AppError } from "@/lib/error-handler";

import { ErrorAlert } from "@/components/ui/alert";
import { RegistrationSuccessChecker } from "@/components/layout/RegistrationSuccessChecker";
import { Mail, Lock } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthSubmitButton } from "@/components/auth/auth-button";
import { AuthFooterLink } from "@/components/auth/auth-footer";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AuthCard>
        <AuthHeader
          title="Welcome Back"
          description="Sign in to your FlowShare account"
        />
        <form onSubmit={handleLogin} className="space-y-4 mt-3">
          <AuthInput
            id="email"
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<Mail className="h-4 w-4" />}
          />

          <AuthInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<Lock className="h-4 w-4" />}
          />

          <Suspense fallback={null}>
            <RegistrationSuccessChecker />
          </Suspense>

          {error && (
            <ErrorAlert
              title={error.title}
              message={error.message}
              action={error.action}
              onClose={() => setError(null)}
            />
          )}

          <AuthSubmitButton loading={loading} loadingText="Signing in...">
            Sign In
          </AuthSubmitButton>

          <AuthFooterLink
            href="/auth/register"
            question="Don't have an account?"
            label="Sign up"
          />
        </form>
      </AuthCard>
    </div>
  );
}
