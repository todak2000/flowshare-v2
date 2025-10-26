import { XCircle } from "lucide-react";
import { InvitationStatusLayout } from "./invitation-status-layout";


export const MissedInvitation = ({ error }: { error: string }) => {
  return (
    <InvitationStatusLayout
      icon={<XCircle className="h-6 w-6 text-destructive" />}
      title="Invitation Not Found"
      description={error || "This invitation may have expired or been cancelled"}
      buttonLabel="Go to Home Page"
      buttonHref="/"
      cardBorderColor="border-destructive/50"
      buttonVariant="outline"
    />
  );
};