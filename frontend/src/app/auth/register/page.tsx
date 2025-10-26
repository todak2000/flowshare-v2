"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  ArrowLeft,
} from "lucide-react";

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

  useEffect(() => {
    // Check if this is an invitee registration
    const invitationAccepted = sessionStorage.getItem("invitationAccepted");

    if (invitationAccepted === "true") {
      // Invitee flow - no payment required
      const invitationId = sessionStorage.getItem("invitationId");
      const email = sessionStorage.getItem("invitationEmail");
      const role = sessionStorage.getItem("invitationRole");
      const tenantId = sessionStorage.getItem("invitationTenantId");
      const partnerName = sessionStorage.getItem("invitationPartnerName");

      if (invitationId && email && role && tenantId) {
        setIsInvitee(true);
        setInvitationData({ invitationId, email, role, tenantId, partnerName: partnerName || "" });
        setFormData(prev => ({ ...prev, email }));
        setSelectedPlan("invitee"); // Special marker for invitees
      } else {
        router.push("/");
      }
    } else {
      // Regular coordinator flow - payment required
      const paymentCompleted = sessionStorage.getItem("paymentCompleted");
      const plan = sessionStorage.getItem("selectedPlan");

      if (!paymentCompleted || !plan) {
        // Redirect to plan selection if payment not completed
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

    // Validation
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
      // 1. Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2. Get the ID token
      const idToken = await userCredential.user.getIdToken();

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      if (isInvitee && invitationData) {
        // 3a. Invitee registration flow
        // Register user without creating a tenant
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

        // Clear session storage
        sessionStorage.removeItem("invitationAccepted");
        sessionStorage.removeItem("invitationId");
        sessionStorage.removeItem("invitationEmail");
        sessionStorage.removeItem("invitationRole");
        sessionStorage.removeItem("invitationTenantId");
        sessionStorage.removeItem("invitationPartnerName");

        // Redirect based on role
        const role = invitationData.role;
        if (role === "partner") {
          router.push("/dashboard/team?welcome=true&role=partner");
        } else if (role === "field_operator") {
          router.push("/dashboard");
        } else if (role === "auditor") {
          router.push("/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        // 3b. Coordinator registration flow
        // Get payment data from sessionStorage
        const paymentDataStr = sessionStorage.getItem("paymentData");
        const paymentData = paymentDataStr ? JSON.parse(paymentDataStr) : null;

        // Register user AND create tenant in backend
        await axios.post(
          `${API_URL}/api/auth/register`,
          {
            full_name: formData.fullName,
            tenant_name: formData.tenantName,
            phone_number: formData.phoneNumber,
            role: "coordinator", // Default role for first user
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

        // Clear session storage
        sessionStorage.removeItem("paymentCompleted");
        sessionStorage.removeItem("selectedPlan");
        sessionStorage.removeItem("paymentData");

        // Mark as first-time registration for login page to detect
        sessionStorage.setItem("newRegistration", "true");

        // Redirect to login page
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/20">
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
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-primary via-primary to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-primary to-violet-600 bg-clip-text text-transparent">
              FlowShare
            </span>
          </Link>
          <Link href="/payment/select-plan">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            {!isInvitee && (
              <Badge variant="secondary" className="mb-4">
                {planNames[selectedPlan]} Plan Selected
              </Badge>
            )}
            {isInvitee && invitationData && (
              <Badge variant="secondary" className="mb-4 capitalize">
                Joining as {invitationData.role.replace("_", " ")}
              </Badge>
            )}
            <h1 className="text-4xl font-bold mb-4">Create Your Account</h1>
            <p className="text-muted-foreground">
              {isInvitee
                ? "Complete your registration to join the joint venture"
                : "Set up your tenant and start managing your joint ventures"}
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Account & Tenant Information</CardTitle>
              <CardDescription>
                Fill in your details to create your account and tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Personal Information</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        required
                        disabled={isInvitee}
                      />
                    </div>
                    {isInvitee && (
                      <p className="text-xs text-muted-foreground">
                        This email is pre-filled from your invitation
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          handleInputChange("phoneNumber", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Tenant Information - Only for coordinators */}
                {!isInvitee && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Joint Venture / Company Information</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenantName">JV/Company Name *</Label>
                      <Input
                        id="tenantName"
                        type="text"
                        placeholder="Acme Oil & Gas JV"
                        value={formData.tenantName}
                        onChange={(e) =>
                          handleInputChange("tenantName", e.target.value)
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        This will be the name of your joint venture or
                        organization
                      </p>
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Security</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 shadow-lg"
                  size="lg"
                  disabled={loading}
                >
                  {loading
                    ? "Creating your account..."
                    : "Complete Registration"}
                </Button>

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

                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
