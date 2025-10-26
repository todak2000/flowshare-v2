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
export interface Partner {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  organization?: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  partner_name?: string;
}

export interface Tenant {
  id: string;
  name: string;
  subscription_plan: string;
}

export const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      coordinator: "default",
      partner: "secondary",
      field_operator: "outline",
      auditor: "outline",
    };
    return colors[role] || "secondary";
  };

  export const getStatusIcon = (status: string) => {
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