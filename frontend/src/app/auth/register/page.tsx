"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Phone, User, Building2, Lock, CheckCircle2 } from "lucide-react";
import { useRegisterForm } from "@/hooks/useRegisterForm";

import { EnhancedAuthInput } from "@/components/auth/enhanced-auth-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import {
  emailValidationRules,
  passwordValidationRules,
  nameValidationRules,
  phoneValidationRules,
} from "@/lib/validation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";

const planNames: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export default function RegisterPage() {
  const {
    formData,
    error,
    setError,
    loading,
    selectedPlan,
    isInvitee,
    invitationData,
    handleFieldChange,
    handleRegister,
    canSubmit,
    confirmPasswordMatches,
  } = useRegisterForm();

  // Loading spinner while checking session
  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-muted/20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  // --- Data-driven field configuration ---
  const confirmPasswordRules = [
    {
      test: (value: string) => value.length > 0 && value === formData.password,
      message: "Passwords must match",
    },
  ];

  const allFields = [
    {
      id: "fullName",
      label: "Full Name",
      type: "text",
      placeholder: "John Doe",
      value: formData.fullName,
      validationRules: nameValidationRules,
      icon: <User className="h-4 w-4" />,
    },
    {
      id: "email",
      label: "Email Address",
      type: "email",
      placeholder: "you@company.com",
      value: formData.email,
      validationRules: emailValidationRules,
      icon: <Mail className="h-4 w-4" />,
      disabled: isInvitee,
      hint: isInvitee ? "Pre-filled from your invitation" : undefined,
    },
    {
      id: "phoneNumber",
      label: "Phone Number",
      type: "tel",
      placeholder: "+1 (555) 000-0000",
      value: formData.phoneNumber,
      validationRules: phoneValidationRules,
      icon: <Phone className="h-4 w-4" />,
    },
    {
      id: "tenantName",
      label: "JV/Company Name",
      type: "text",
      placeholder: "Acme Oil & Gas JV",
      value: formData.tenantName,
      validationRules: nameValidationRules,
      icon: <Building2 className="h-4 w-4" />,
      hint: "Your joint venture or organization name",
      hidden: isInvitee, // Hide this field for invitees
    },
    {
      id: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
      value: formData.password,
      validationRules: passwordValidationRules,
      icon: <Lock className="h-4 w-4" />,
      showValidation: true,
    },
    {
      id: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      placeholder: "••••••••",
      value: formData.confirmPassword,
      validationRules: confirmPasswordRules,
      icon: <Lock className="h-4 w-4" />,
    },
  ];

  // Filter out hidden fields
  const fieldsToShow = allFields.filter((field) => !field.hidden);
  
  // --- Dynamic Header & Footer Content ---
  const headerBadge = isInvitee ? (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.3 }}
      className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-linear-to-r from-emerald-500/10 to-primary/10 border-2 border-emerald-500/20"
    >
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 capitalize">
        Joining as {invitationData?.role.replace("_", " ")}
      </span>
    </motion.div>
  ) : (
    <div className="flex flex-row items-center gap-2 text-foreground">Create a
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.3 }}
        className="inline-flex my-3 items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-linear-to-r from-primary/10 to-violet-600/10 border-2 border-primary/20"
      >
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          {planNames[selectedPlan]} Plan
        </span>
      </motion.div>
      Account
    </div>
  );

  const footerContent = (
    <div className="space-y-3 mt-6">
      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </p>
      <p className="text-xs text-center text-muted-foreground/80">
        By creating an account, you agree to our{" "}
        <Link href="#" className="text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  );

  return (
    <AuthLayout
      subtitle={
        isInvitee
          ? "Complete your registration to join"
          : "Set up your account and start managing"
      }
      headerBadge={headerBadge}
    >
      <AuthForm
        onSubmit={handleRegister}
        error={error}
        onErrorClose={() => setError(null)}
        loading={loading}
        canSubmit={canSubmit}
        submitText="Complete Registration"
        loadingText="Creating your account..."
        footerContent={footerContent}
      >
        {fieldsToShow.map((field) => (
          <div key={field.id} className="space-y-2">
            <EnhancedAuthInput
              id={field.id}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onChange={(value, isValid) =>
                handleFieldChange(field.id, value, isValid)
              }
              validationRules={field.validationRules}
              icon={field.icon}
              disabled={field.disabled}
              hint={field.hint}
              showValidation={field.showValidation}
              required
            />
            {field.id === "password" && formData.password.length > 0 && (
              <PasswordStrengthMeter password={formData.password} show={true} />
            )}
          </div>
        ))}
      </AuthForm>
    </AuthLayout>
  );
}