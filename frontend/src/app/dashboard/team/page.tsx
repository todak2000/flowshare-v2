"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  UserPlus,
  Mail,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Settings as SettingsIcon,
  ArrowRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth-store";

interface Partner {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  organization?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  partner_name?: string;
}

interface Tenant {
  id: string;
  name: string;
  subscription_plan: string;
}

function TeamManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "true";
  const { getUserRole } = useAuthStore();
  const userRole = getUserRole(); // Get role from query params

  const [cancelInvitationId, setCancelInvitationId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(isWelcome);
  const [inviteData, setInviteData] = useState({
    partnerName: "",
    email: "",
    role: userRole === "partner" ? "field_operator" : "partner",
  });

  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [currentPartnerCount, setCurrentPartnerCount] = useState(0);
  const [maxPartners, setMaxPartners] = useState(5);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      // 1. Get current user
      const userData = await apiClient
        .get<any>("/api/auth/me")
        .catch(() => null);
      setCurrentUser(userData);

      // Check if field operator - they shouldn't access this page
      if (userData?.role === "field_operator") {
        router.push("/dashboard");
        return;
      }

      // 2. Get tenant first
      const tenantData = await apiClient
        .get<Tenant>("/api/tenants/me")
        .catch(() => null);
      setTenant(tenantData);

      if (!tenantData) {
        throw new Error("Tenant not found");
      }

      // 3. Fetch partners and invitations
      const [rawPartners, invitationsData] = await Promise.all([
        apiClient.get<Partner[]>("/api/partners").catch(() => []),
        apiClient
          .get<Invitation[]>("/api/invitations", {
            tenant_id: tenantData.id,
          })
          .catch(() => []),
      ]);

      // Map User[] → Partner[]
      const partnersData = rawPartners.map((user) => ({
        id: user.id,
        name: user.full_name ? user.full_name : user.name, // 👈 critical mapping
        email: user.email,
        role: user.role,
        status: "active",
        created_at: user.created_at,
        organization: user.organization, // Include organization/company name
      }));

      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setInvitations(Array.isArray(invitationsData) ? invitationsData : []);

      // Calculate limits based on role
      if (userData?.role === "partner") {
        // Partners can only invite field operators
        // Only count ACTIVE field operators (not pending invitations)
        const fieldOperators = partnersData.filter(
          (p) => p.role === "field_operator"
        );

        // For now, allow up to 10 field operators per partner
        // This should ideally come from the pricing plan
        setMaxPartners(10);
        setCurrentPartnerCount(fieldOperators.length);
      } else {
        // Coordinators manage all partners
        // Only count ACTIVE partners (not pending invitations or field operators)
        const activePartners = partnersData.filter((p) => p.role === "partner");

        const plan = tenantData.subscription_plan;
        const limits: Record<string, number> = {
          starter: 5,
          professional: 20,
          enterprise: -1,
        };
        setMaxPartners(limits[plan] || 5);
        setCurrentPartnerCount(activePartners.length);
      }
    } catch (error) {
      console.error("Failed to fetch team data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");

    // Validate partner limit
    if (maxPartners !== -1 && currentPartnerCount >= maxPartners) {
      setInviteError(
        `You've reached the maximum number of partners (${maxPartners}) for your plan. Please upgrade to add more partners.`
      );
      return;
    }

    setInviting(true);

    try {
      await apiClient.post("/api/invitations", {
        partner_name: inviteData.partnerName,
        email: inviteData.email,
        role: inviteData.role,
        tenant_id: tenant.id,
      });

      // Reset form and refresh data
      setInviteData({ partnerName: "", email: "", role: "partner" });
      setShowInviteForm(false);
      await fetchTeamData();
    } catch (error: any) {
      let errorMsg = "Failed to send invitation";

      if (error.response?.data?.detail) {
        // Handle both string and object cases
        const detail = error.response.data.detail;
        if (typeof detail === "string") {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          // Sometimes it's an array of errors
          errorMsg = detail.map((err: any) => err.msg || err).join(", ");
        } else if (typeof detail === "object") {
          // Extract meaningful message from object
          errorMsg = detail.msg || JSON.stringify(detail);
        }
      }
      setInviteError(errorMsg);
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

  const handleCancelInvitation = (invitationId: string) => {
    setCancelInvitationId(invitationId); // Open dialog for this ID
  };

  const handleConfirmCancel = async () => {
    if (!cancelInvitationId) return;

    try {
      await apiClient.post(`/api/invitations/${cancelInvitationId}/cancel`);
      await fetchTeamData();
      setCancelInvitationId(null); // Close dialog
    } catch (error) {
      alert("Failed to cancel invitation");
      setCancelInvitationId(null);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      coordinator: "default",
      partner: "secondary",
      field_operator: "outline",
      auditor: "outline",
    };
    return colors[role] || "secondary";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      case "expired":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Sidebar - reusing from dashboard */}

      {/* Main Content */}
      <div className="">
        <header className="border-b border-border bg-background/80 backdrop-blur-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Team Management</h1>
              <p className="text-sm text-muted-foreground">
                {currentUser?.role === "partner"
                  ? "Invite and manage your field operators"
                  : "Invite and manage your joint venture partners"}
              </p>
            </div>
            <Button
              onClick={() => setShowInviteForm(true)}
              className="bg-primary hover:bg-primary/90 shadow-lg"
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
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{userRole ==='partner' ? 'Field Operator':'Partner'} Capacity</CardTitle>
                  <CardDescription>
                    {maxPartners === -1
                      ? "Unlimited partners on your plan"
                      : `${currentPartnerCount} of ${maxPartners} partners`}
                  </CardDescription>
                </div>
                {tenant && (
                  <Badge variant="default" className="capitalize">
                    {tenant.subscription_plan} Plan
                  </Badge>
                )}
              </div>
            </CardHeader>
            {maxPartners !== -1 && (
              <CardContent>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      currentPartnerCount >= maxPartners
                        ? "bg-destructive"
                        : "bg-primary"
                    }`}
                    style={{
                      width: `${(currentPartnerCount / maxPartners) * 100}%`,
                    }}
                  ></div>
                </div>
                {currentPartnerCount >= maxPartners && (
                  <p className="text-sm text-destructive mt-2">
                    You've reached your partner limit.{" "}
                    <Link href="/dashboard/settings" className="underline">
                      Upgrade your plan
                    </Link>{" "}
                    to add more partners.
                  </p>
                )}
              </CardContent>
            )}
          </Card>

          {/* Invite Form */}
          {showInviteForm && (
            <Card className="border-2 border-primary/50">
              <CardHeader>
                <CardTitle>
                  {currentUser?.role === "partner"
                    ? "Invite Field Operator"
                    : "Invite Partner"}
                </CardTitle>
                <CardDescription>
                  {currentUser?.role === "partner"
                    ? "Send an invitation to a field operator"
                    : "Send an invitation to a partner company"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvitePartner} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {currentUser?.role !== "partner" && (
                      <div className="space-y-2">
                        <Label htmlFor="partnerName">
                          Partner Company Name *
                        </Label>
                        <Input
                          id="partnerName"
                          placeholder="ABC Oil & Gas"
                          value={inviteData.partnerName}
                          onChange={(e) =>
                            setInviteData((prev) => ({
                              ...prev,
                              partnerName: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={
                          currentUser?.role === "partner"
                            ? "operator@company.com"
                            : "partner@company.com"
                        }
                        value={inviteData.email}
                        onChange={(e) =>
                          setInviteData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  {inviteError && (
                    <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive">{inviteError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={inviting}
                      className="bg-primary"
                    >
                      {inviting ? "Sending..." : "Send Invitation"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowInviteForm(false);
                        setInviteError("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
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
                {partners.filter((p) => p.role === "partner").length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No active partners yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Invite partners to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {partners
                      .filter((p) => p.role === "partner")
                      .map((partner) => (
                        <div
                          key={partner.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {partner.name?.slice(0, 2)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {partner.name}
                              {currentUser?.id === partner.id && (
                                <span className="ml-2 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                  (YOU)
                                </span>
                              )}
                            </p>
                            {partner.organization && (
                              <p className="text-sm font-medium text-primary truncate">
                                {partner.organization}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground truncate">
                              {partner.email}
                            </p>
                          </div>
                          <Badge
                            variant={getRoleColor(partner.role) as any}
                            className="capitalize"
                          >
                            {partner.role.replace("_", " ")}
                          </Badge>
                          <Badge variant="success">Active</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Active Field Operators (only visible to coordinators and partners) */}
          {userRole ==='partner' && partners.filter((p) => p.role === "field_operator").length > 0 && (
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
                <div className="space-y-3">
                  {partners
                    .filter((p) => p.role === "field_operator")
                    .map((operator) => (
                      <div
                        key={operator.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {operator.name?.slice(0, 2)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {operator.name}
                          </p>
                          {operator.organization && (
                            <p className="text-sm font-medium text-primary truncate">
                              {operator.organization}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground truncate">
                            {operator.email}
                          </p>
                        </div>
                        <Badge
                          variant={getRoleColor(operator.role) as any}
                          className="capitalize"
                        >
                          {operator.role.replace("_", " ")}
                        </Badge>
                        <Badge variant="success">Active</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle>
                  Pending Invitations ({invitations.length})
                </CardTitle>
                <CardDescription>
                  Invitations awaiting acceptance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border"
                    >
                      <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {invitation.partner_name || invitation.email}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {invitation.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invitation.status)}
                        <Badge variant="outline" className="capitalize">
                          {invitation.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(invitation.id)}
                        >
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {partners.length >= 2 && (
            <Card className="border-2 border-success/50 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">
                      Great! You're all set 🎊
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      You've invited {currentPartnerCount} partners. Next,
                      configure your tenant settings or explore the dashboard.
                    </p>
                    <div className="flex gap-3">
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
          onOpenChange={(open) => !open && setCancelInvitationId(null)}
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
                onClick={() => setCancelInvitationId(null)}
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

export default function TeamManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <TeamManagementContent />
    </Suspense>
  );
}
