// components/invitation/StatusCheck.tsx
import { CheckCircle2, XCircle } from "lucide-react";
import { InvitationStatusLayout } from "./invitation-status-layout";
import { Invitation } from "@/app/invitation/[id]/page";

export const StatusCheck = ({
  isExpired,
  isAccepted,
  isCancelled,
  
}: {
  isExpired: boolean;
  isAccepted: boolean;
  isCancelled: boolean;
}) => {
  if (!isExpired && !isAccepted && !isCancelled) {
    return null; // or handle active state elsewhere
  }

  const config = isAccepted
    ? {
        icon: <CheckCircle2 className="h-6 w-6 text-success" />,
        title: "Invitation Already Accepted",
        description: "This invitation has already been accepted",
        color: "border-success/50",
        buttonLabel: "Go to Login",
        buttonHref: "/auth/login",
        buttonVariant: "default" as const,
      }
    : isCancelled
    ? {
        icon: <XCircle className="h-6 w-6 text-destructive" />,
        title: "Invitation Cancelled",
        description: "This invitation has been cancelled by the sender",
        color: "border-destructive/50",
        buttonLabel: "Go to Home Page",
        buttonHref: "/",
        buttonVariant: "outline" as const,
      }
    : {
        icon: <XCircle className="h-6 w-6 text-destructive" />,
        title: "Invitation Expired",
        description: "This invitation has expired",
        color: "border-destructive/50",
        buttonLabel: "Go to Home Page",
        buttonHref: "/",
        buttonVariant: "outline" as const,
      };

  return (
    <InvitationStatusLayout
      icon={config.icon}
      title={config.title}
      description={config.description}
      buttonLabel={config.buttonLabel}
      buttonHref={config.buttonHref}
      cardBorderColor={config.color}
      buttonVariant={config.buttonVariant}
    />
  );
};