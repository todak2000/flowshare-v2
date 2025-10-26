import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export interface InfoItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: "primary" | "warning";
}

export interface InvitationDetailsCardProps {
  infoItems: InfoItem[];
  onAccept: () => void;
  onReject: () => void;
  accepting: boolean;
  rejecting: boolean;
}

export function InvitationDetailsCard({
  infoItems,
  onAccept,
  onReject,
  accepting,
  rejecting,
}: InvitationDetailsCardProps) {
  return (
    <Card className="border-2 border-primary/50">
      <CardHeader>
        <CardTitle>Invitation Details</CardTitle>
        <CardDescription>
          Review the information below and decide whether to accept
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mapped Info Items */}
        <div className="space-y-3">
          {infoItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  item.color === "warning"
                    ? "bg-warning/10"
                    : "bg-primary/10"
                }`}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="font-semibold capitalize">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="p-4 border border-primary/50 bg-primary/5 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Click "Accept Invitation" to create your account</li>
                <li>No payment required - you're joining as an invitee</li>
                <li>You'll be redirected to complete your registration</li>
                <li>After registration, you'll have access to your dashboard</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onAccept}
            disabled={accepting}
            className="flex-1 bg-primary hover:bg-primary/90 shadow-lg"
            size="lg"
          >
            {accepting ? "Accepting..." : "Accept Invitation"}
          </Button>
          <Button
            onClick={onReject}
            disabled={rejecting}
            variant="outline"
            size="lg"
          >
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}