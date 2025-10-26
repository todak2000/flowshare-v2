"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  Building2,
  Calculator,
  Thermometer,
  Gauge,
  CreditCard,
  ArrowLeft,
  Save,
  Crown,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

interface TenantSettings {
  allocation_model: string;
  default_temperature_standard: number;
  default_pressure_standard: number;
}

interface Tenant {
  id: string;
  name: string;
  subscription_plan: string;
  settings: TenantSettings;
  status: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [formData, setFormData] = useState<TenantSettings>({
    allocation_model: "api_mpms_11_1",
    default_temperature_standard: 60.0,
    default_pressure_standard: 14.696,
  });

  useEffect(() => {
    loadTenantSettings();
  }, []);

  const loadTenantSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Tenant>("/api/tenants/me");
      setTenant(response);

      if (response.settings) {
        setFormData(response.settings);
      }
    } catch (err: any) {
      console.error("Failed to load tenant settings:", err);
      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiClient.patch("/api/tenants/me", {
        settings: formData,
      });

      setSuccess("Settings saved successfully!");

      // Reload tenant data
      await loadTenantSettings();
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to save settings. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof TenantSettings,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const allocationModels = [
    {
      value: "api_mpms_11_1",
      label: "API MPMS 11.1",
      description: "Industry standard allocation model",
    },
    {
      value: "model_b",
      label: "Model B",
      description: "Alternative allocation method",
    },
    {
      value: "model_c",
      label: "Model C",
      description: "Advanced allocation model",
    },
  ];

  const planNames: Record<string, string> = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  const planLimits: Record<
    string,
    { maxPartners: number; maxEntries: number; price: number | null }
  > = {
    starter: { maxPartners: 5, maxEntries: 200, price: 499 },
    professional: { maxPartners: 20, maxEntries: 800, price: 999 },
    enterprise: { maxPartners: -1, maxEntries: -1, price: null },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Failed to load tenant information</p>
      </div>
    );
  }

  const currentPlan =
    planLimits[tenant.subscription_plan] || planLimits.starter;

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      {/* Header */}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tenant Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Organization Information</CardTitle>
                </div>
                <Badge
                  variant={tenant.status === "active" ? "success" : "secondary"}
                >
                  {tenant.status}
                </Badge>
              </div>
              <CardDescription>
                Your joint venture / organization details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">
                  Orgnaization Name
                </Label>
                <p className="text-lg font-semibold mt-1">{tenant.name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  Organization ID
                </Label>
                <p className="font-mono text-sm mt-1">{tenant.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle>Subscription Plan</CardTitle>
              </div>
              <CardDescription>Your current plan and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold text-lg">
                      {planNames[tenant.subscription_plan] || "Starter"}
                    </p>
                    {currentPlan.price !== null && (
                      <p className="text-sm text-muted-foreground">
                        ${currentPlan.price}/month
                      </p>
                    )}
                    {currentPlan.price === null && (
                      <p className="text-sm text-muted-foreground">
                        Custom Pricing
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/payment/select-plan">Upgrade Plan</Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Max Partners
                  </p>
                  <p className="text-2xl font-bold">
                    {currentPlan.maxPartners === -1
                      ? "Unlimited"
                      : currentPlan.maxPartners}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Max Entries/Month
                  </p>
                  <p className="text-2xl font-bold">
                    {currentPlan.maxEntries === -1
                      ? "Unlimited"
                      : currentPlan.maxEntries}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allocation Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle>Allocation Model</CardTitle>
              </div>
              <CardDescription>
                Configure calculation method for joint venture allocations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allocation_model">Allocation Model *</Label>
                <Select
                  value={formData.allocation_model}
                  onValueChange={(value) =>
                    handleInputChange("allocation_model", value)
                  }
                >
                  <SelectTrigger id="allocation_model">
                    <SelectValue placeholder="Select allocation model" />
                  </SelectTrigger>
                  <SelectContent>
                    {allocationModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex  items-center gap-1">
                          <span className="font-medium">{model.label} - </span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selected model will be used for all allocation calculations
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Default Standards */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Thermometer className="h-5 w-5 text-primary" />
                <CardTitle>Default Standards</CardTitle>
              </div>
              <CardDescription>
                Set default temperature and pressure standards for measurements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="temperature">
                  Default Temperature Standard (°F) *
                </Label>
                <div className="relative">
                  <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="60.0"
                    className="pl-10"
                    value={formData.default_temperature_standard}
                    onChange={(e) =>
                      handleInputChange(
                        "default_temperature_standard",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Industry standard is typically 60°F
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pressure">
                  Default Pressure Standard (psia) *
                </Label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pressure"
                    type="number"
                    step="0.001"
                    placeholder="14.696"
                    className="pl-10"
                    value={formData.default_pressure_standard}
                    onChange={(e) =>
                      handleInputChange(
                        "default_pressure_standard",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Industry standard is typically 14.696 psia
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 border border-success/50 bg-success/10 rounded-lg">
              <p className="text-sm text-success">{success}</p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to sign in again to
              access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutModalOpen(false)}
              disabled={loggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? "Logging out..." : "Logout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
