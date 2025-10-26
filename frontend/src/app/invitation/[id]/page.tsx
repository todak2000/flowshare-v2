"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { Mail } from "lucide-react";

import { MissedInvitation } from "@/components/invitation/missed";
import { StatusCheck } from "@/components/invitation/status-check";
import { ActiveCard } from "@/components/invitation/active";

export interface Invitation {
  id: string;
  email: string;
  partner_name?: string;
  role: string;
  status: string;
  tenant_id: string;
  tenant_name?: string;
  created_at: string;
  expires_at: string;
}

export default function InvitationPage() {
  const router = useRouter();
  const params = useParams();
  const invitationId = params.id as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [invitationId]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${API_URL}/api/invitations/${invitationId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch invitation");
      }

      const invitationData = await response.json();
      setInvitation(invitationData);
    } catch (err: any) {
      console.error("Failed to fetch invitation:", err);
      setError(err.message || "Invitation not found or has expired");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    sessionStorage.setItem("invitationId", invitationId);
    sessionStorage.setItem("invitationAccepted", "true");
    if (invitation) {
      sessionStorage.setItem("invitationEmail", invitation.email);
      sessionStorage.setItem("invitationRole", invitation.role);
      sessionStorage.setItem("invitationTenantId", invitation.tenant_id);
      sessionStorage.setItem(
        "invitationPartnerName",
        invitation.partner_name || ""
      );
    }
    router.push("/auth/register");
  };

  const handleReject = async () => {
    try {
      setRejecting(true);
      // TODO: Implement reject API endpoint
      alert("Invitation rejected. You can close this page.");
    } finally {
      setRejecting(false);
    }
  };

  // === Loading State ===
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const expiresAt = new Date(
    invitation?.expires_at as "string | number | Date"
  );
  const isExpired = expiresAt < now;
  const isAccepted = invitation?.status === "accepted";
  const isCancelled = invitation?.status === "cancelled";

  // === Error or Missing Invitation ===
  if (error || !invitation) {
    <MissedInvitation error={error} />;
  }
  <>
    {/* === Status Checks === */}
    <StatusCheck
      isExpired={isExpired}
      isAccepted={isAccepted}
      isCancelled={isCancelled}
    />

    {/* === Active Invitation === */}
    <ActiveCard
      invitation={invitation}
      handleAccept={handleAccept}
      handleReject={handleReject}
      accepting={accepting}
      rejecting={rejecting}
      expiresAt={expiresAt}
    />
  </>;
}
