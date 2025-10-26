"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuthStore } from "@/store/auth-store";
import { handleApiError, type AppError } from "@/lib/error-handler";
import { RegistrationSuccessChecker } from "@/components/layout/RegistrationSuccessChecker";

export default function LoginPage() {
  const router = useRouter();

  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Check if this is the user's first login
   * - If last_login_at is null, it's their first login
   * - If created_at and last_login_at are within 10 seconds, it's their first login
   * - Check session storage for newRegistration flag
   */
  const checkIsFirstLogin = (userData: any): boolean => {
    // Check session storage flag first
    const newRegistration = sessionStorage.getItem("newRegistration");
    if (newRegistration === "true") {
      sessionStorage.removeItem("newRegistration");
      return true;
    }

    // Check if last_login_at is null or very close to created_at
    if (!userData.last_login_at) {
      return true;
    }

    // If last_login_at and created_at are within 10 seconds, consider it first login
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
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Get the ID token directly from the user credential
      const idToken = await userCredential.user.getIdToken();

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Verify user exists in backend (and sync if needed)
      let userData;
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        userData = response.data;
      } catch (apiError: any) {
        // If user doesn't exist in backend, they need to complete registration
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
          // Other API errors
          throw apiError;
        }
      }


      // Populate Zustand store with user data
      if (userData) {
        setUser(userData); // Backend response already matches our UserProfile interface
      }

      // Check if this is first login
      const isFirstLogin = checkIsFirstLogin(userData);

      // Redirect based on login type
      if (isFirstLogin) {
        // First time login - show welcome screen
        if (userData.role === "coordinator") {
          router.push("/dashboard/team?welcome=true");
        } else if (userData.role === "partner") {
          router.push("/dashboard/team?welcome=true");
        } else {
          router.push("/dashboard");
        }
      } else {
        // Regular login
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);

      // Use centralized error handler
      const appError = handleApiError(err);
      setError(appError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your FlowShare account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
