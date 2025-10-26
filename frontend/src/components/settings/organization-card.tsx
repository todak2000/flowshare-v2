import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { Tenant } from "@/hooks/useTenantSettings"; // Import the shared type

interface OrganizationCardProps {
  tenant: Tenant;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({ tenant }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Organization Information</CardTitle>
        </div>
        <Badge variant={tenant.status === "active" ? "success" : "secondary"}>
          {tenant.status}
        </Badge>
      </div>
      <CardDescription>
        Your joint venture / organization details
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label className="text-sm text-muted-foreground">
          Organization Name
        </Label>
        <p className="text-lg font-semibold mt-1">{tenant.name}</p>
      </div>
      <div>
        <Label className="text-sm text-muted-foreground">Organization ID</Label>
        <p className="font-mono text-sm mt-1">{tenant.id}</p>
      </div>
    </CardContent>
  </Card>
);