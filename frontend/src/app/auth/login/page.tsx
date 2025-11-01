"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { handleApiError, type AppError } from "@/lib/error-handler";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { EnhancedAuthInput } from "@/components/auth/enhanced-auth-input";
import { ErrorAlert } from "@/components/ui/alert";
import { RegistrationSuccessChecker } from "@/components/layout/RegistrationSuccessChecker";
import { normalizeEmail, emailValidationRules } from "@/lib/validation";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailValid, setEmailValid] = useState(false);
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
      // Normalize email before Firebase authentication
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

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/30 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-400/30 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
          animate={{
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight,
            ],
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth,
            ],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Glass morphism card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="backdrop-blur-xl bg-white/70 shadow-2xl shadow-blue-500/10 rounded-3xl p-8 border border-white/20"
        >
          {/* Logo and header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8 flex flex-col  items-center gap-3"
          >
            <motion.div whileHover={{ scale: 1.05, rotate: 5 }}>
              <Logo />
            </motion.div>

            <p className="text-gray-600 mt-2">
              Sign in to your FlowShare account
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleLogin}
            className="space-y-5"
          >
            <EnhancedAuthInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(value, isValid) => {
                setEmail(value);
                setEmailValid(isValid);
              }}
              validationRules={emailValidationRules}
              icon={<Mail className="h-4 w-4" />}
              required
            />

            <EnhancedAuthInput
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(value) => setPassword(value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />

            <Suspense fallback={null}>
              <RegistrationSuccessChecker />
            </Suspense>

            {/* Error alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ErrorAlert
                    title={error.title}
                    message={error.message}
                    action={error.action}
                    onClose={() => setError(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={!canSubmit || loading}
              whileHover={{ scale: canSubmit && !loading ? 1.02 : 1 }}
              whileTap={{ scale: canSubmit && !loading ? 0.98 : 1 }}
              className="relative w-full mt-6 py-3.5 rounded-xl font-semibold text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 group-hover:from-blue-700 group-hover:to-purple-700" />

              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: loading ? ["-100%", "100%"] : "-100%",
                }}
                transition={{
                  duration: 1,
                  repeat: loading ? Infinity : 0,
                  ease: "linear",
                }}
              />

              {/* Button content */}
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
