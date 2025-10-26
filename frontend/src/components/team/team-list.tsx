import { Users } from "lucide-react";
import { getRoleColor, Partner } from "./components";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";

export const TeamMemberList = ({
  title,
  description,
  members,
  currentUser,
  roleLabel,
}: {
  title: string;
  description: string;
  members: Partner[];
  currentUser: any;
  roleLabel: string; // e.g., "Partner" or "Field Operator"
}) => {
  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No active {roleLabel.toLowerCase()}s yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Invite {roleLabel.toLowerCase()}s to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
        >
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {member.name?.slice(0, 2)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {member.name}
              {currentUser?.id === member.id && (
                <span className="ml-2 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                  (YOU)
                </span>
              )}
            </p>
            {member.organization && (
              <p className="text-sm font-medium text-primary truncate">
                {member.organization}
              </p>
            )}
            <p className="text-sm text-muted-foreground truncate">
              {member.email}
            </p>
          </div>
          <Badge
            variant={getRoleColor(member.role) as any}
            className="capitalize"
          >
            {member.role.replace("_", " ")}
          </Badge>
          <Badge variant="success">Active</Badge>
        </div>
      ))}
    </div>
  );
};