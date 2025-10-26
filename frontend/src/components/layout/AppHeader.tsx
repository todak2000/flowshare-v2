// components/layout/AppHeader.tsx
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  backHref?: string;
  backLabel?: string;
}

export function AppHeader({ backHref, backLabel = "Back" }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
            FlowShare
          </span>
        </Link>

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