// components/layout/AppHeader.tsx
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

interface AppHeaderProps {
  backHref?: string;
  backLabel?: string;
}

export function AppHeader({ backHref, backLabel = "Back" }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Back Button (optional) */}
        {backHref ? (
          <Link href={backHref}>
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Button>
          </Link>
        ) : null}
      </div>
    </header>
  );
}