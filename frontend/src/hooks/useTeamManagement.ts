import { useState, useEffect, useMemo, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store"; // <-- Your actual store
import { useTenant } from "./useTenant"; // <-- Our reusable hook
import { Invitation, Partner } from "@/components/team/components"; // Adjust path

// Helper to parse complex API errors
const parseApiError = (error: any): string => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
      return detail.map((err: any) => err.msg || err).join(", ");
    if (typeof detail === "object") return detail.msg || JSON.stringify(detail);
  }
  return "An unknown error occurred.";
};

export function useTeamManagement() {
  // 1. Consume reusable hooks and store
  const { user: currentUser, isLoading: loadingUser } = useAuthStore();
  const { tenant, loadingTenant } = useTenant();

  // 2. Manage team-specific state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true); // Specific to this hook's fetches

  // 3. Manage UI/form state
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [cancelInvitationId, setCancelInvitationId] = useState<string | null>(
    null
  );

  // 4. Fetch team data (partners/invitations) once tenant is loaded
  const fetchTeamData = useCallback(async () => {
    if (!tenant) return; // Wait for tenant

    try {
      setLoadingTeam(true);
      const [rawPartners, invitationsData] = await Promise.all([
        apiClient.get<Partner[]>("/api/partners").catch(() => []),
        apiClient
          .get<Invitation[]>("/api/invitations", { tenant_id: tenant.id })
          .catch(() => []),
      ]);

      const partnersData = rawPartners.map((user: any) => ({
        id: user.id,
        name: user.full_name || user.name,
        email: user.email,
        role: user.role,
        status: "active",
        created_at: user.created_at,
        organization: user.organization,
      }));

      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setInvitations(Array.isArray(invitationsData) ? invitationsData : []);
    } catch (error) {
      console.error("Failed to fetch team data:", error);
    } finally {
      setLoadingTeam(false);
    }
  }, [tenant]); // Re-run only if tenant changes

  useEffect(() => {
    if (tenant) {
      fetchTeamData();
    } else if (!loadingTenant) {
      // If tenant isn't loading and is still null, we're not loading team.
      setLoadingTeam(false);
    }
  }, [fetchTeamData, tenant, loadingTenant]);

  // 5. Derive state (calculations)
  const { currentPartnerCount, maxPartners } = useMemo(() => {
    if (!currentUser || !tenant)
      return { currentPartnerCount: 0, maxPartners: 5 };

    if (currentUser.role === "partner") {
      const fieldOperators = partners.filter(
        (p) => p.role === "field_operator"
      );
      return { maxPartners: 10, currentPartnerCount: fieldOperators.length };
    } else {
      const activePartners = partners.filter((p) => p.role === "partner");
      const limits: Record<string, number> = {
        starter: 5,
        professional: 20,
        enterprise: -1,
      };
      return {
        maxPartners: limits[tenant.subscription_plan] || 5,
        currentPartnerCount: activePartners.length,
      };
    }
  }, [partners, currentUser, tenant]);

  // 6. Action Handlers
  const handleInvitePartner = async (inviteData: {
    partnerName: string;
    email: string;
    role: string;
  }) => {
    if (!tenant) return false;
    setInviteError("");

    if (maxPartners !== -1 && currentPartnerCount >= maxPartners) {
      setInviteError(
        `You've reached the maximum number of partners (${maxPartners}).`
      );
      return false; // Indicate failure
    }

    setInviting(true);
    try {
      await apiClient.post("/api/invitations", {
        ...inviteData,
        tenant_id: tenant.id,
      });
      await fetchTeamData(); // Refresh list
      return true; // Indicate success
    } catch (error: any) {
      setInviteError(parseApiError(error));
      return false; // Indicate failure
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await apiClient.post(`/api/invitations/${invitationId}/resend`);
      alert("Invitation resent successfully!");
    } catch (error) {
      alert("Failed to resend invitation");
    }
  };

  const handleCancelInvitation = (invitationId?: string|null) => {
    setCancelInvitationId(invitationId ? invitationId : null); // Open dialog for this ID
  };

  const handleConfirmCancel = async () => {
    if (!cancelInvitationId) return;
    try {
      await apiClient.post(`/api/invitations/${cancelInvitationId}/cancel`);
      await fetchTeamData(); // Refresh list
      setCancelInvitationId(null); // Close dialog
    } catch (error) {
      alert("Failed to cancel invitation");
      setCancelInvitationId(null);
    }
  };

  // 7. Return everything the UI needs
  return {
    // Combine all loading states for the page
    loading: loadingUser || loadingTenant || loadingTeam,
    currentUser,
    userRole: currentUser?.role,
    tenant,
    partners,
    invitations,
    currentPartnerCount,
    maxPartners,
    inviting,
    inviteError,
    setInviteError,
    handleInvitePartner,
    handleResendInvitation,
    cancelInvitationId,
    handleCancelInvitation,
    handleConfirmCancel,
  };
}
