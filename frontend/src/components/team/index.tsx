"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
// ... other UI imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // ... other dialog imports
} from "@/components/ui/dialog";
import { TeamMemberList } from "@/components/team/team-list";
import { InviteForm } from "@/components/team/invite-form";
import { InvitationList } from "@/components/team/pending-invitation";
import { CapacityUsageCard } from "@/components/team/partner-limit";
import { getStatusIcon } from "@/components/team/components";
import { useTeamManagement } from "@/hooks/useTeamManagement"; // <-- Import our hook
import {
  ArrowRight,
  CheckCircle2,
  SettingsIcon,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Link from "next/link";
import { PageLoader } from "../layout/PageLoader";

export function TeamManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "true";

  // *** ALL LOGIC IS HERE ***
  const {
    loading,
    currentUser,
    userRole,
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
  } = useTeamManagement();

  // Local UI state
  const [showInviteForm, setShowInviteForm] = useState(isWelcome);

  // Wrapper for submit handler
  const onInviteSubmit = async (data: {
    partnerName: string;
    email: string;
  }) => {
    const success = await handleInvitePartner({
      ...data,
      role: userRole === "partner" ? "field_operator" : "partner",
    });

    if (success) {
      setShowInviteForm(false);
      setInviteError("");
    }
  };

  // Field operators should not see this page
  if (!loading && currentUser?.role === "field_operator") {
    router.push("/dashboard");
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <PageLoader />
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Sidebar - reusing from dashboard */}

      {/* Main Content */}
      <div className="">
        <header className="border-b border-border bg-background/80 backdrop-blur-lg px-6 py-4">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:items-center justify-between">
            <div>
              <h1 className="text-lg lg:text-2xl font-bold">Team Management</h1>
              <p className="text-sm text-muted-foreground">
                {currentUser?.role === "partner"
                  ? "Invite and manage your field operators"
                  : "Invite and manage your joint venture partners"}
              </p>
            </div>
            <Button
              onClick={() => setShowInviteForm(true)}
              className="bg-primary hover:bg-primary/90 shadow-lg w-max"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {currentUser?.role === "partner"
                ? "Invite Field Operator"
                : "Invite Partner"}
            </Button>
          </div>
        </header>

        <main className="p-6 space-y-8">
          {/* Welcome Message */}
          {isWelcome && (
            <Card className="border-2 border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">
                      Welcome to FlowShare! 🎉
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {currentUser?.role === "partner"
                        ? `Your account has been created successfully. Now, you can invite your field operators to help manage production data. You can invite up to ${
                            maxPartners === -1 ? "unlimited" : maxPartners
                          } field operators.`
                        : `Your account and tenant have been created successfully. Now, let's invite your partners to join your joint venture. You can invite up to ${
                            maxPartners === -1 ? "unlimited" : maxPartners
                          } partners on your current plan.`}
                    </p>
                    <Button
                      onClick={() => setShowInviteForm(true)}
                      className="bg-primary"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {currentUser?.role === "partner"
                        ? "Invite Your First Field Operator"
                        : "Invite Your First Partner"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Partner Limit Card */}
          <CapacityUsageCard
            userRole={userRole as string}
            currentPartnerCount={currentPartnerCount}
            maxPartners={maxPartners}
            tenant={tenant}
          />

          {/* Invite Form */}
          {showInviteForm && (
            <InviteForm
              currentUser={currentUser}
              inviting={inviting}
              inviteError={inviteError}
              onSubmit={handleInvitePartner}
              onCancel={() => {
                setShowInviteForm(false);

                setInviteError("");
              }}
            />
          )}

          {/* Active Partners */}
          {userRole === "coordinator" && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle>
                  Active Partners (
                  {partners.filter((p) => p.role === "partner").length})
                </CardTitle>
                <CardDescription>
                  Partners who have accepted their invitation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamMemberList
                  title="Active Partners"
                  description="Partners who have accepted their invitation"
                  members={partners.filter((p) => p.role === "partner")}
                  currentUser={currentUser}
                  roleLabel="Partner"
                />
              </CardContent>
            </Card>
          )}

          {/* Active Field Operators */}
          {userRole === "partner" && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle>
                  Active Field Operators (
                  {partners.filter((p) => p.role === "field_operator").length})
                </CardTitle>
                <CardDescription>
                  Field operators who have accepted their invitation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamMemberList
                  title="Active Field Operators"
                  description="Field operators who have accepted their invitation"
                  members={partners.filter((p) => p.role === "field_operator")}
                  currentUser={currentUser}
                  roleLabel="Field Operator"
                />
              </CardContent>
            </Card>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <InvitationList
              invitations={invitations}
              getStatusIcon={getStatusIcon}
              onResend={handleResendInvitation}
              onCancel={handleCancelInvitation}
            />
          )}

          {/* Next Steps */}
          {partners.length >= 2 && (
            <Card className="border-2 border-success/50 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">
                      Great! You're all set 🎊
                    </h3>
                    <p className="text-muted-foreground mb-4 text-xs md:text-base">
                      You've invited {currentPartnerCount} partners. Next,
                      configure your tenant settings or explore the dashboard.
                    </p>
                    <div className="flex flex-col md:flex-row gap-3">
                      <Link href="/dashboard/settings">
                        <Button className="bg-primary">
                          <SettingsIcon className="mr-2 h-4 w-4" />
                          Configure Settings
                        </Button>
                      </Link>
                      <Link href="/dashboard">
                        <Button variant="outline">
                          Go to Dashboard
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
        {/* Cancel Invitation Confirmation Dialog */}
        <Dialog
          open={!!cancelInvitationId}
          onOpenChange={(open) => !open && handleCancelInvitation(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Invitation</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this invitation? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleCancelInvitation(null)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel}>
                <Trash2 className="mr-2 h-4 w-4" />
                Cancel Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
