import { ReactNode } from "react";
import Link from "next/link";
import { AppHeader } from "../layout/AppHeader";
import { Button, ButtonProps } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface InvitationStatusLayoutProps {
  icon: ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  cardBorderColor?: string;
  buttonVariant?: ButtonProps["variant"];
}

export function InvitationStatusLayout({
  icon,
  title,
  description,
  buttonLabel,
  buttonHref,
  cardBorderColor = "border-destructive/50",
  buttonVariant = "default",
}: InvitationStatusLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <AppHeader />
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className={`border-2 ${cardBorderColor}`}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                  {icon}
                </div>
                <div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={buttonHref}>
                <Button variant={buttonVariant} className="w-full">
                  {buttonLabel}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}