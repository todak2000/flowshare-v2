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

interface Partner {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
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
    role: "partner",
  });
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [currentPartnerCount, setCurrentPartnerCount] = useState(0);
  const [maxPartners, setMaxPartners] = useState(5);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      // 1. Get tenant first
      const tenantData = await apiClient
        .get<Tenant>("/api/tenants/me")
        .catch(() => null);
      setTenant(tenantData);

      if (!tenantData) {
        throw new Error("Tenant not found");
      }

      // 2. Fetch partners and invitations
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
        name: user.full_name? user.full_name: user.name, // 👈 critical mapping
        email: user.email,
        role: user.role,
        status: "active",
        created_at: user.created_at,
      }));

      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setInvitations(Array.isArray(invitationsData) ? invitationsData : []);

      // Calculate limits
      const plan = tenantData.subscription_plan;
      const limits: Record<string, number> = {
        starter: 5,
        professional: 20,
        enterprise: -1,
      };
      setMaxPartners(limits[plan] || 5);
      setCurrentPartnerCount(
        (partnersData?.length || 0) + (invitationsData?.length || 0)
      );
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
      let errorMessage = "Failed to send invitation";

      if (error.response?.data?.detail) {
        // Handle both string and object cases
        const detail = error.response.data.detail;
        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          // Sometimes it's an array of errors
          errorMessage = detail.map((err: any) => err.msg || err).join(", ");
        } else if (typeof detail === "object") {
          // Extract meaningful message from object
          errorMessage = detail.msg || JSON.stringify(detail);
        }
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Sidebar - reusing from dashboard */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-card border-r border-border hidden lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-border px-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
              FlowShare
            </span>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground font-medium transition-all hover:bg-muted hover:text-foreground"
            >
              <Users className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/dashboard/team"
              className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3 text-primary font-medium transition-all hover:bg-primary/20"
            >
              <Users className="h-5 w-5" />
              <span>Team</span>
            </Link>
            <Separator className="my-4" />
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground font-medium transition-all hover:bg-muted hover:text-foreground"
            >
              <SettingsIcon className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        <header className="border-b border-border bg-background/80 backdrop-blur-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Team Management</h1>
              <p className="text-sm text-muted-foreground">
                Invite and manage your joint venture partners
              </p>
            </div>
            <Button
              onClick={() => setShowInviteForm(true)}
              className="bg-primary hover:bg-primary/90 shadow-lg"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Partner
            </Button>
          </div>
        </header>

        <main className="p-6 space-y-8">
          {/* Welcome Message */}
          {isWelcome && (
            <Card className="border-2 border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">
                      Welcome to FlowShare! 🎉
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Your account and tenant have been created successfully.
                      Now, let's invite your partners to join your joint
                      venture. You can invite up to{" "}
                      {maxPartners === -1 ? "unlimited" : maxPartners} partners
                      on your current plan.
                    </p>
                    <Button
                      onClick={() => setShowInviteForm(true)}
                      className="bg-primary"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Your First Partner
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
                  <CardTitle>Partner Capacity</CardTitle>
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
                <CardTitle>Invite Partner</CardTitle>
                <CardDescription>
                  Send an invitation to a partner company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvitePartner} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="partner@company.com"
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
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Active Partners ({partners.length})</CardTitle>
              <CardDescription>
                Partners who have accepted their invitation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {partners.length === 0 ? (
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
                  {partners.map((partner) => (
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
                        <p className="font-medium truncate">{partner.name}</p>
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
