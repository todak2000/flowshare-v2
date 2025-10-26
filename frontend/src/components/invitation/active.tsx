import { Building2, User, Clock, Mail } from "lucide-react";
import { InfoItem, InvitationDetailsCard } from "./invitation-card";
import { AppHeader } from "../layout/AppHeader";
import { Invitation } from "@/app/invitation/[id]/page";

// ... inside component, after fetching invitation

interface ActiveCardProps {
  invitation: Invitation | null;
  handleAccept: () => Promise<void>;
  handleReject: () => Promise<void>;
  accepting: boolean;
  rejecting: boolean;
  expiresAt: any
}
export const ActiveCard = ({
  invitation,
  handleAccept,
  handleReject,
  accepting,
  rejecting,
  expiresAt
}: ActiveCardProps) => {
  
  const infoItems: InfoItem[] = [
    {
      label: "Joint Venture",
      value: invitation?.tenant_name || "Joint Venture",
      icon: <Building2 className="h-5 w-5 text-primary" />,
      color: "primary",
    },
    {
      label: "Your Role",
      value: invitation?.role.replace("_", " ") || "",
      icon: <User className="h-5 w-5 text-primary" />,
      color: "primary",
    },
    ...(invitation?.partner_name
      ? [
          {
            label: "Partner Company",
            value: invitation?.partner_name,
            icon: <Building2 className="h-5 w-5 text-primary" />,
            color: "primary" as const,
          },
        ]
      : []),
    {
      label: "Expires On",
      value: expiresAt?.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      icon: <Clock className="h-5 w-5 text-warning" />,
      color: "warning",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <AppHeader />
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">You've Been Invited!</h1>
            <p className="text-muted-foreground text-lg">
              Join {invitation?.tenant_name || "this joint venture"} on
              FlowShare
            </p>
          </div>

          <InvitationDetailsCard
            infoItems={infoItems}
            onAccept={handleAccept}
            onReject={handleReject}
            accepting={accepting}
            rejecting={rejecting}
          />
        </div>
      </main>
    </div>
  );
};
