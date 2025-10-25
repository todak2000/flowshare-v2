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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Shield,
  Bell,
  ArrowLeft,
  Save,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { auth } from "@/lib/firebase";

interface NotificationSettings {
  email_notifications: boolean;
  entry_updates: boolean;
  reconciliation_alerts: boolean;
  report_generation: boolean;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: string;
  tenant_ids: string[];
  notification_settings: NotificationSettings;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    entry_updates: true,
    reconciliation_alerts: true,
    report_generation: true,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<User>("/api/auth/me");
      setUser(response);

      setFormData({
        full_name: response.full_name,
        phone_number: response.phone_number || "",
      });

      if (response.notification_settings) {
        setNotificationSettings(response.notification_settings);
      }
    } catch (err: any) {
      console.error("Failed to load user profile:", err);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiClient.patch("/api/users/me", {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        notification_settings: notificationSettings,
      });

      setSuccess("Profile updated successfully!");

      // Reload user data
      await loadUserProfile();
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to save profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [field]: value }));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleColors: Record<string, string> = {
    coordinator: "bg-primary text-primary-foreground",
    partner: "bg-violet-500 text-white",
    field_operator: "bg-blue-500 text-white",
    auditor: "bg-amber-500 text-white",
  };

  const roleNames: Record<string, string> = {
    coordinator: "JV Coordinator",
    partner: "Partner",
    field_operator: "Field Operator",
    auditor: "Auditor",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Failed to load user profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-violet-600 text-primary-foreground">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-bold">My Profile</h1>
                <p className="text-xs text-muted-foreground">
                  Manage your personal information
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>Your account information and role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-violet-600 text-primary-foreground text-2xl">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold">{user.full_name}</h2>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={roleColors[user.role] || "bg-muted"}>
                      <Shield className="mr-1 h-3 w-3" />
                      {roleNames[user.role] || user.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-primary" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={user.email}
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support for assistance.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="pl-10"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <input
                  id="email_notifications"
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300"
                  checked={notificationSettings.email_notifications}
                  onChange={(e) =>
                    handleNotificationChange("email_notifications", e.target.checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="entry_updates">Entry Updates</Label>
                  <p className="text-xs text-muted-foreground">
                    Notify when production entries are created or modified
                  </p>
                </div>
                <input
                  id="entry_updates"
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300"
                  checked={notificationSettings.entry_updates}
                  onChange={(e) =>
                    handleNotificationChange("entry_updates", e.target.checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reconciliation_alerts">Reconciliation Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Notify when discrepancies are found during reconciliation
                  </p>
                </div>
                <input
                  id="reconciliation_alerts"
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300"
                  checked={notificationSettings.reconciliation_alerts}
                  onChange={(e) =>
                    handleNotificationChange("reconciliation_alerts", e.target.checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="report_generation">Report Generation</Label>
                  <p className="text-xs text-muted-foreground">
                    Notify when reports are generated and ready to download
                  </p>
                </div>
                <input
                  id="report_generation"
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300"
                  checked={notificationSettings.report_generation}
                  onChange={(e) =>
                    handleNotificationChange("report_generation", e.target.checked)
                  }
                />
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
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
