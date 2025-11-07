"use client";

import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  Mail,
  Key,
  User,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Get demo password from environment variable
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "";

interface UserCredentials {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: string;
  organization?: string;
  partner_id?: string;
}

interface DemoTenant {
  tenant_id: string;
  tenant_name: string;
  created_at: string;
  coordinator: UserCredentials;
  partners: UserCredentials[];
  field_operators: UserCredentials[];
}

export default function DemoAdminPage() {
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [demoTenants, setDemoTenants] = useState<DemoTenant[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Fetch demo tenants on mount
  useEffect(() => {
    if (!DEMO_PASSWORD) {
      setMessage({
        type: "error",
        text: "Demo admin password not configured. Set NEXT_PUBLIC_DEMO_ADMIN_PASSWORD environment variable."
      });
    } else {
      fetchDemoTenants();
    }
  }, []);

  const fetchDemoTenants = async () => {
    
    setLoading(true);
    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/demo/tenants`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch demo tenants");
      }

      const data = await response.json();
      setDemoTenants(data);
    } catch (error: any) {
      console.error("Failed to fetch demo tenants:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to fetch demo tenants",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDemoTenant = async () => {
    if (password !== DEMO_PASSWORD) {
      setMessage({
        type: "error",
        text: "Incorrect password. Cannot create demo tenant.",
      });
      return;
    }

    setCreateLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/demo/create-tenant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password,
            num_partners: 4,
            generate_data_months: 3,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create demo tenant");
      }

      const result = await response.json();

      setMessage({
        type: "success",
        text: `Successfully created demo tenant "${result.tenant_name}" with ${result.partners.length} partners and ${result.production_entries_created} production entries!`,
      });

      // Refresh the list
      await fetchDemoTenants();
      setPassword("");
    } catch (error: any) {
      console.error("Failed to create demo tenant:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to create demo tenant",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const deleteDemoTenant = async (tenantId: string, tenantName: string) => {
    if (password !== DEMO_PASSWORD) {
      setMessage({
        type: "error",
        text: "Incorrect password. Cannot delete demo tenant.",
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${tenantName}" and all associated data? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleteLoading(tenantId);
    setMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/demo/delete-tenant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            password: password,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete demo tenant");
      }

      const result = await response.json();

      setMessage({
        type: "success",
        text: `Successfully deleted "${tenantName}" and ${result.deleted_counts.users} users, ${result.deleted_counts.production_entries} entries!`,
      });

      // Refresh the list
      await fetchDemoTenants();
      setPassword("");
    } catch (error: any) {
      console.error("Failed to delete demo tenant:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to delete demo tenant",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "coordinator":
        return "bg-purple-500 hover:bg-purple-600";
      case "partner":
        return "bg-blue-500 hover:bg-blue-600";
      case "field_operator":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          FlowShare Demo Admin
        </h1>
        <p className="text-muted-foreground mt-2">
          Create and manage demo tenants with auto-generated users and production
          data
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <Card
          className={`mb-6 border-2 ${
            message.type === "success"
              ? "border-green-500 bg-green-500/10"
              : "border-destructive bg-destructive/10"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              )}
              <p
                className={
                  message.type === "success"
                    ? "text-green-700 dark:text-green-400"
                    : "text-destructive"
                }
              >
                {message.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Demo Tenant */}
      <Card className="mb-6 border-green-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Plus className="h-5 w-5" />
            Create New Demo Tenant
          </CardTitle>
          <CardDescription>
            Auto-generate a complete demo tenant with 1 coordinator, 4 partners, 4
            field operators, and 3 months of production data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Admin Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={createLoading || loading}
            />
            <p className="text-xs text-muted-foreground">
              Password required to prevent unauthorized creation
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-semibold mb-2">What will be created:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 1 Coordinator with full admin access</li>
              <li>• 4 Partners with unique organizations (generated by Faker)</li>
              <li>• 4 Field Operators (1 per partner)</li>
              <li>
                • 3 months of production data (excluding current month) - all days
              </li>
              <li>
                • Disproportionate production values (no two partners within 5%)
              </li>
              <li>• All users use password: Qwerty@12345</li>
              <li>• All data marked with is_demo: true for easy cleanup</li>
            </ul>
          </div>

          <Button
            onClick={createDemoTenant}
            disabled={!password || createLoading || loading}
            className="w-full"
            size="lg"
          >
            {createLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating Demo Tenant...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Demo Tenant
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Demo Tenants */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Existing Demo Tenants
              </CardTitle>
              <CardDescription>
                All demo tenants with login credentials (Default password:
                Qwerty@12345)
              </CardDescription>
            </div>
            <Button
              onClick={fetchDemoTenants}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading demo tenants...
              </span>
            </div>
          ) : demoTenants.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No demo tenants found. Create one to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {demoTenants.map((tenant) => (
                <div
                  key={tenant.tenant_id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  {/* Tenant Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {tenant.tenant_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Created:{" "}
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tenant ID: {tenant.tenant_id}
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        deleteDemoTenant(tenant.tenant_id, tenant.tenant_name)
                      }
                      disabled={deleteLoading === tenant.tenant_id || !password}
                      variant="destructive"
                      size="sm"
                    >
                      {deleteLoading === tenant.tenant_id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Tenant
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Users Table */}
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Password</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Coordinator */}
                        <TableRow>
                          <TableCell>
                            <Badge
                              className={getRoleBadgeColor(
                                tenant.coordinator.role
                              )}
                            >
                              {formatRole(tenant.coordinator.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {tenant.coordinator.full_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {tenant.coordinator.email}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {tenant.coordinator.password}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            -
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() =>
                                copyToClipboard(
                                  `${tenant.coordinator.email}:${tenant.coordinator.password}`,
                                  `coordinator-${tenant.tenant_id}`
                                )
                              }
                              variant="ghost"
                              size="sm"
                            >
                              {copiedText ===
                              `coordinator-${tenant.tenant_id}` ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Partners */}
                        {tenant.partners.map((partner, idx) => (
                          <TableRow key={partner.id}>
                            <TableCell>
                              <Badge className={getRoleBadgeColor(partner.role)}>
                                {formatRole(partner.role)} #{idx + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {partner.full_name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {partner.email}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {partner.password}
                            </TableCell>
                            <TableCell className="text-sm">
                              {partner.organization || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() =>
                                  copyToClipboard(
                                    `${partner.email}:${partner.password}`,
                                    `partner-${partner.id}`
                                  )
                                }
                                variant="ghost"
                                size="sm"
                              >
                                {copiedText === `partner-${partner.id}` ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Field Operators */}
                        {tenant.field_operators.map((operator, idx) => {
                          const partner = tenant.partners.find(
                            (p) => p.id === operator.partner_id
                          );
                          return (
                            <TableRow key={operator.id}>
                              <TableCell>
                                <Badge
                                  className={getRoleBadgeColor(operator.role)}
                                >
                                  {formatRole(operator.role)} #{idx + 1}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {operator.full_name}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {operator.email}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {operator.password}
                              </TableCell>
                              <TableCell className="text-sm">
                                {partner?.organization || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() =>
                                    copyToClipboard(
                                      `${operator.email}:${operator.password}`,
                                      `operator-${operator.id}`
                                    )
                                  }
                                  variant="ghost"
                                  size="sm"
                                >
                                  {copiedText === `operator-${operator.id}` ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">1</p>
                      <p className="text-xs text-muted-foreground">
                        Coordinator
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {tenant.partners.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Partners</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {tenant.field_operators.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Field Operators
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Requirement Notice */}
      {demoTenants.length > 0 && !password && (
        <Card className="border-yellow-500 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Enter the admin password above to enable tenant deletion.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
