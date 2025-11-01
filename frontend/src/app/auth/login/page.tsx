"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { useLoginForm } from "@/hooks/useLoginForm";

import { EnhancedAuthInput } from "@/components/auth/enhanced-auth-input";
import { RegistrationSuccessChecker } from "@/components/layout/RegistrationSuccessChecker";
import { emailValidationRules } from "@/lib/validation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  const {
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
  } = useLoginForm();

  const fields = [
    {
      id: "email",
      label: "Email Address",
      type: "email",
      placeholder: "you@company.com",
      value: email,
      onChange: setEmail,
      onValidated: setEmailValid,
      validationRules: emailValidationRules,
      icon: <Mail className="h-4 w-4" />,
    },
    {
      id: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
      value: password,
      onChange: setPassword,
      onValidated: () => {}, // No validation needed for parent
      validationRules: [],
      icon: <Lock className="h-4 w-4" />,
    },
  ];

  return (
    <AuthLayout subtitle="Sign in to your FlowShare account">
      <AuthForm
        onSubmit={handleLogin}
        error={error}
        onErrorClose={() => setError(null)}
        loading={loading}
        canSubmit={canSubmit}
        submitText="Sign In"
        loadingText="Signing in..."
        footerContent={
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Sign up
            </Link>
          </p>
        }
      >
        {fields.map((field) => (
          <EnhancedAuthInput
            key={field.id}
            id={field.id}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            value={field.value}
            onChange={(value, isValid) => {
              field.onChange(value);
              if (field.onValidated) field.onValidated(isValid);
            }}
            validationRules={field.validationRules}
            icon={field.icon}
            required
          />
        ))}

        <Suspense fallback={null}>
          <RegistrationSuccessChecker />
        </Suspense>
      </AuthForm>
    </AuthLayout>
  );
}
