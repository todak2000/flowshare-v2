import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="text-center" />
      <CardContent>{children}</CardContent>
    </Card>
  );
}
