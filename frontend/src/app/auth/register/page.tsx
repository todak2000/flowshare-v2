"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "axios";

import { Badge } from "@/components/ui/badge";
import { Mail, Phone, User, Building2, Lock } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthSubmitButton } from "@/components/auth/auth-button";
import { AuthFooterLink } from "@/components/auth/auth-footer";

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!formData.phoneNumber.match(/^[\d\s\+\-\(\)]+$/)) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background via-background to-muted/20">
        <p className="text-muted-foreground">Checking payment status...</p>
      </div>
    );
  }

  const planNames: Record<string, string> = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      <AppHeader backHref="/payment/select-plan" backLabel="Back to Plans" />

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-md mx-auto">
          {/* Badge Header */}
          <div className="text-center mb-8">
            {!isInvitee && selectedPlan && (
              <Badge variant="secondary" className="mb-4">
                {planNames[selectedPlan]} Plan Selected
              </Badge>
            )}
            {isInvitee && invitationData && (
              <Badge variant="secondary" className="mb-4 capitalize">
                Joining as {invitationData.role.replace("_", " ")}
              </Badge>
            )}
          </div>

          {/* Auth Card */}
          <AuthCard className="border-2">
            <AuthHeader
              title="Create Your Account"
              description={
                isInvitee
                  ? "Complete your registration to join the joint venture"
                  : "Set up your tenant and start managing your joint ventures"
              }
            />

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Personal Info */}
              <AuthInput
                id="fullName"
                label="Full Name *"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                required
                icon={<User className="h-4 w-4" />}
              />

              <AuthInput
                id="email"
                label="Email Address *"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                disabled={isInvitee}
                icon={<Mail className="h-4 w-4" />}
                description={
                  isInvitee
                    ? "This email is pre-filled from your invitation"
                    : undefined
                }
              />

              <AuthInput
                id="phoneNumber"
                label="Phone Number *"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                required
                icon={<Phone className="h-4 w-4" />}
              />

              {/* Tenant Info (Coordinator Only) */}
              {!isInvitee && (
                <AuthInput
                  id="tenantName"
                  label="JV/Company Name *"
                  type="text"
                  placeholder="Acme Oil & Gas JV"
                  value={formData.tenantName}
                  onChange={(e) =>
                    handleInputChange("tenantName", e.target.value)
                  }
                  required
                  icon={<Building2 className="h-4 w-4" />}
                  description="This will be the name of your joint venture or organization"
                />
              )}

              {/* Password */}
              <AuthInput
                id="password"
                label="Password *"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                icon={<Lock className="h-4 w-4" />}
                description="Must be at least 6 characters"
              />

              <AuthInput
                id="confirmPassword"
                label="Confirm Password *"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                required
                icon={<Lock className="h-4 w-4" />}
              />

              {/* Error */}
              {error && (
                <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit */}
              <AuthSubmitButton
                loading={loading}
                loadingText="Creating your account..."
              >
                Complete Registration
              </AuthSubmitButton>

              {/* Footer Link */}
              <AuthFooterLink
                href="/auth/login"
                question="Already have an account?"
                label="Sign in"
              />

              {/* Terms */}
              <p className="text-xs text-center text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link href="#" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </AuthCard>
        </div>
      </main>
    </div>
  );
}
