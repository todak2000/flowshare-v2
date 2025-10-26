import { FormEvent, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"; // Adjust paths
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/store/auth-store";

// --- (These interfaces are the same as before) ---

interface InviteFormData {
  email: string;
  partnerName: string;
}

interface InviteFormProps {
  currentUser: UserProfile | null;
  inviting: boolean;
  inviteError: string | null | undefined;
  onSubmit: (e: any) => Promise<boolean>;
  onCancel: () => void;
}

// --- The Refactored Component ---

export const InviteForm: React.FC<InviteFormProps> = ({
  currentUser,
  inviting,
  inviteError,
  onSubmit,
  onCancel,
}) => {
  const [inviteData, setInviteData] = useState<InviteFormData>({
    email: "",
    partnerName: "",
  });

  const isPartner = currentUser?.role === "partner";

  // 1. Define the form fields as data
  const formFields = [
    {
      id: "partnerName",
      label: "Partner Company Name *",
      type: "text",
      placeholder: "ABC Oil & Gas",
      required: true,
      // Conditionally show this field
      show: !isPartner,
    },
    {
      id: "email",
      label: "Email Address *",
      type: "email",
      placeholder: isPartner ? "operator@company.com" : "partner@company.com",
      required: true,
      // Always show this field
      show: true,
    },
  ];

  // 2. Create a generic change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setInviteData((prev) => ({
      ...prev,
      // Use the 'id' to update the correct key in the state
      [id]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inviteData);
  };

  const handleCancel = () => {
    setInviteData({ email: "", partnerName: "" });
    onCancel();
  };

  return (
    <Card className="border-2 border-primary/50">
      <CardHeader>
        <CardTitle>
          {isPartner ? "Invite Field Operator" : "Invite Partner"}
        </CardTitle>
        <CardDescription>
          {isPartner
            ? "Send an invitation to a field operator"
            : "Send an invitation to a partner company"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* 3. Map over the fields to render them */}
            {formFields.map((field) =>
              // Use the 'show' property to conditionally render
              field.show ? (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Input
                    id={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    // Assert the key type for TypeScript
                    value={inviteData[field.id as keyof InviteFormData]}
                    onChange={handleChange}
                    required={field.required}
                  />
                </div>
              ) : null
            )}
          </div>

          {inviteError && (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">{inviteError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={inviting} className="bg-primary">
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
