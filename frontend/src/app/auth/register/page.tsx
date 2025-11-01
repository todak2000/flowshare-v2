"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, User, Building2, Lock, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { EnhancedAuthInput } from "@/components/auth/enhanced-auth-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import {
  normalizeEmail,
  emailValidationRules,
  passwordValidationRules,
  nameValidationRules,
  phoneValidationRules,
} from "@/lib/validation";
import { Logo } from "@/components/layout/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    tenantName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [validation, setValidation] = useState({
    fullName: false,
    tenantName: false,
    email: false,
    phoneNumber: false,
    password: false,
    confirmPassword: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isInvitee, setIsInvitee] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    invitationId: string;
    email: string;
    role: string;
    tenantId: string;
    partnerName: string;
  } | null>(null);

  // Detect registration flow
  useEffect(() => {
    const invitationAccepted = sessionStorage.getItem("invitationAccepted");
    if (invitationAccepted === "true") {
      const invitationId = sessionStorage.getItem("invitationId");
      const email = sessionStorage.getItem("invitationEmail");
      const role = sessionStorage.getItem("invitationRole");
      const tenantId = sessionStorage.getItem("invitationTenantId");
      const partnerName = sessionStorage.getItem("invitationPartnerName");

      if (invitationId && email && role && tenantId) {
        setIsInvitee(true);
        setInvitationData({
          invitationId,
          email,
          role,
          tenantId,
          partnerName: partnerName || "",
        });
        setFormData((prev) => ({ ...prev, email }));
        setValidation((prev) => ({ ...prev, email: true, tenantName: true }));
        setSelectedPlan("invitee");
      } else {
        router.push("/");
      }
    } else {
      const paymentCompleted = sessionStorage.getItem("paymentCompleted");
      const plan = sessionStorage.getItem("selectedPlan");
      if (!paymentCompleted || !plan) {
        router.push("/payment/select-plan");
        return;
      }
      setSelectedPlan(plan);
    }
  }, [router]);

  const handleFieldChange = (field: string, value: string, isValid: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidation((prev) => ({ ...prev, [field]: isValid }));
  };

  // Custom confirm password validation
  const confirmPasswordMatches = formData.confirmPassword === formData.password;
  const confirmPasswordRules = [
    {
      test: (value: string) => value.length > 0 && value === formData.password,
      message: "Passwords must match",
    },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Normalize email before Firebase authentication
      const normalizedEmail = normalizeEmail(formData.email);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        formData.password
      );
      const idToken = await userCredential.user.getIdToken();
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      if (isInvitee && invitationData) {
        await axios.post(
          `${API_URL}/api/auth/register-invitee`,
          {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            invitation_id: invitationData.invitationId,
          },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Clear session
        [
          "invitationAccepted",
          "invitationId",
          "invitationEmail",
          "invitationRole",
          "invitationTenantId",
          "invitationPartnerName",
        ].forEach((key) => sessionStorage.removeItem(key));

        const role = invitationData.role;
        if (role === "partner")
          router.push("/dashboard/team?welcome=true&role=partner");
        else if (role === "field_operator") router.push("/dashboard");
        else router.push("/dashboard");
      } else {
        const paymentDataStr = sessionStorage.getItem("paymentData");
        const paymentData = paymentDataStr ? JSON.parse(paymentDataStr) : null;

        await axios.post(
          `${API_URL}/api/auth/register`,
          {
            full_name: formData.fullName,
            tenant_name: formData.tenantName,
            phone_number: formData.phoneNumber,
            role: "coordinator",
            subscription_plan: selectedPlan,
            payment_data: paymentData,
          },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        ["paymentCompleted", "selectedPlan", "paymentData"].forEach((key) =>
          sessionStorage.removeItem(key)
        );
        sessionStorage.setItem("newRegistration", "true");
        router.push("/auth/login?registered=true");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  const planNames: Record<string, string> = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  const canSubmit =
    validation.fullName &&
    validation.email &&
    validation.phoneNumber &&
    validation.password &&
    confirmPasswordMatches &&
    (isInvitee || validation.tenantName);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      {/* Animated background - same as login */}
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

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg px-6"
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
            className="text-center mb-6 flex flex-col items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Logo />
            </motion.div>

            {/* Plan badge */}
            {!isInvitee && selectedPlan && (
              <div className="flex flex-row items-center gap-2">Create a 
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.3 }}
                className="inline-flex my-3 items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200"
              >
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {planNames[selectedPlan]} Plan 
                </span>
              </motion.div>
              Account
              </div>
            )}

            {isInvitee && invitationData && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.3 }}
                className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-200"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 capitalize">
                  Joining as {invitationData.role.replace("_", " ")}
                </span>
              </motion.div>
            )}

            <p className="text-gray-600 mt-2">
              {isInvitee
                ? "Complete your registration to join"
                : "Set up your account and start managing"}
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleRegister}
            className="space-y-4"
          >
            <EnhancedAuthInput
              id="fullName"
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(value, isValid) => handleFieldChange("fullName", value, isValid)}
              validationRules={nameValidationRules}
              icon={<User className="h-4 w-4" />}
              required
            />

            <EnhancedAuthInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(value, isValid) => handleFieldChange("email", value, isValid)}
              validationRules={emailValidationRules}
              icon={<Mail className="h-4 w-4" />}
              disabled={isInvitee}
              hint={isInvitee ? "Pre-filled from your invitation" : undefined}
              required
            />

            <EnhancedAuthInput
              id="phoneNumber"
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phoneNumber}
              onChange={(value, isValid) => handleFieldChange("phoneNumber", value, isValid)}
              validationRules={phoneValidationRules}
              icon={<Phone className="h-4 w-4" />}
              required
            />

            {!isInvitee && (
              <EnhancedAuthInput
                id="tenantName"
                label="JV/Company Name"
                type="text"
                placeholder="Acme Oil & Gas JV"
                value={formData.tenantName}
                onChange={(value, isValid) => handleFieldChange("tenantName", value, isValid)}
                validationRules={nameValidationRules}
                icon={<Building2 className="h-4 w-4" />}
                hint="Your joint venture or organization name"
                required
              />
            )}

            <div className="space-y-2">
              <EnhancedAuthInput
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(value, isValid) => handleFieldChange("password", value, isValid)}
                validationRules={passwordValidationRules}
                showValidation={true}
                icon={<Lock className="h-4 w-4" />}
                required
              />
              <PasswordStrengthMeter password={formData.password} show={formData.password.length > 0} />
            </div>

            <EnhancedAuthInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, confirmPassword: value }));
              }}
              validationRules={confirmPasswordRules}
              icon={<Lock className="h-4 w-4" />}
              required
            />

            {/* Error alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-lg bg-red-50 border border-red-200"
                >
                  <p className="text-sm text-red-600">{error}</p>
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
                    Creating your account...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </motion.button>

            {/* Footer */}
            <div className="space-y-3 mt-6">
              <p className="text-sm text-center text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>

              <p className="text-xs text-center text-gray-500">
                By creating an account, you agree to our{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </motion.form>
        </motion.div>

       
      </motion.div>
    </div>
  );
}
