import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { UserProfile } from "@/store/auth-store";

// Co-locate helpers
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

interface ProfileOverviewCardProps {
  user: UserProfile;
}

export const ProfileOverviewCard: React.FC<ProfileOverviewCardProps> = ({
  user,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Overview</CardTitle>
        <CardDescription>Your account information and role</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-violet-600 text-primary-foreground text-2xl">
              {getInitials(user.full_name ?? "User")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-bold">{user.full_name}</h2>
              <p className="text-sm text-muted-foreground">
                {user.organization}
              </p>
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
  );
};