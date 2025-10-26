import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"; // Adjust paths as needed
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Trash2 } from "lucide-react";

// 1. Define the type for a single invitation
export interface Invitation {
  id: string | number;
  partner_name?: string | null;
  email: string;
  status: string;
}

// 2. Define the props for the component
interface InvitationListProps {
  /** The array of invitation objects to display */
  invitations: Invitation[];
  /** A function that returns a React node (e.g., an icon) based on status */
  getStatusIcon: (status: string) => React.ReactNode;
  /** Function to call when "Resend" is clicked */
  onResend: (invitationId: string) => Promise<void>
  /** Function to call when "Cancel" (Trash icon) is clicked */
  onCancel: (invitationId: string) => void
  /** Optional override for the card title */
  title?: string;
  /** Optional override for the card description */
  description?: string;
}

export const InvitationList: React.FC<InvitationListProps> = ({
  invitations,
  getStatusIcon,
  onResend,
  onCancel,
  title,
  description,
}) => {
  // 3. Use props for data and provide sensible defaults
  const cardTitle = title || `Pending Invitations (${invitations.length})`;
  const cardDescription = description || "Invitations awaiting acceptance";

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 4. Add a clean empty state */}
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            There are no pending invitations.
          </p>
        ) : (
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
                    onClick={() => onResend(invitation.id as string)}
                  >
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCancel(invitation.id as string)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};