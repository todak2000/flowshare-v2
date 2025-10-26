import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User as UserIcon, Mail, Phone, Bell } from "lucide-react";

// Define prop types (can be moved to a shared types file)
interface ProfileFormData {
  full_name: string;
  phone_number: string;
}
interface NotificationSettings {
  email_reports: boolean;
  email_anomaly_alerts: boolean;
}

interface ProfileSettingsFormProps {
  email: string; // Pass non-editable email
  formData: ProfileFormData;
  notificationSettings: NotificationSettings;
  onInputChange: (field: keyof ProfileFormData, value: string) => void;
  onNotificationChange: (
    field: keyof NotificationSettings,
    value: boolean
  ) => void;
}

export const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({
  email,
  formData,
  notificationSettings,
  onInputChange,
  onNotificationChange,
}) => {
  return (
    <>
      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserIcon className="h-5 w-5 text-primary" />
            <CardTitle>Personal Information</CardTitle>
          </div>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e) => onInputChange("full_name", e.target.value)}
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
                value={email}
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
                onChange={(e) => onInputChange("phone_number", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences Card */}
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
              <Label htmlFor="email_anomaly_alerts">Anomaly Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Receive email alerts for data anomalies.
              </p>
            </div>
            <input
              id="email_anomaly_alerts"
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300"
              checked={notificationSettings.email_anomaly_alerts}
              onChange={(e) =>
                onNotificationChange("email_anomaly_alerts", e.target.checked)
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_reports">Periodic Reports</Label>
              <p className="text-xs text-muted-foreground">
                Receive daily/weekly summary reports via email.
              </p>
            </div>
            <input
              id="email_reports"
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300"
              checked={notificationSettings.email_reports}
              onChange={(e) =>
                onNotificationChange("email_reports", e.target.checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};