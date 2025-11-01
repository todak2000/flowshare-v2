"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { normalizeEmail } from "@/lib/validation";
import { type AppError } from "@/lib/error-handler";

interface InvitationData {
  invitationId: string;
  email: string;
  role: string;
  tenantId: string;
  partnerName: string;
}

export function useRegisterForm() {
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
  });
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isInvitee, setIsInvitee] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(
    null
  );

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
        const data = {
          invitationId,
          email,
          role,
          tenantId,
          partnerName: partnerName || "",
        };
        setInvitationData(data);
        setFormData((prev) => ({ ...prev, email: data.email }));
        setValidation((prev) => ({ ...prev, email: true, tenantName: true })); // tenantName is bypassed for invitee
        setSelectedPlan("invitee");
      } else {
        // Invalid invitee state, redirect
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

  const handleFieldChange = (
    field: string,
    value: string,
    isValid: boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidation((prev) => ({ ...prev, [field]: isValid }));
  };

  const confirmPasswordMatches =
    formData.password.length > 0 &&
    formData.confirmPassword === formData.password;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!confirmPasswordMatches) {
      setError({
        title: "Password Mismatch",
        message: "The passwords you entered do not match.",
      });
      return;
    }

    setLoading(true);
    try {
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
          { headers: { Authorization: `Bearer ${idToken}` } }
        );

        // Set auth cookie for middleware (expires in 7 days)
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        document.cookie = `auth-token=${idToken}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

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
          { headers: { Authorization: `Bearer ${idToken}` } }
        );

        ["paymentCompleted", "selectedPlan", "paymentData"].forEach((key) =>
          sessionStorage.removeItem(key)
        );
        sessionStorage.setItem("newRegistration", "true");
        router.push("/auth/login?registered=true");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Failed to register. Please try again.";
      setError({ title: "Registration Error", message });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    validation.fullName &&
    validation.email &&
    validation.phoneNumber &&
    validation.password &&
    confirmPasswordMatches &&
    (isInvitee || validation.tenantName);

  return {
    formData,
    validation,
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
  };
}
