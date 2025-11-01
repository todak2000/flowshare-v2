import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { ChevronRight } from "lucide-react";
import { footerLinks } from "./landing-data";

export function LandingFooter() {
  return (
    <footer className="bg-foreground/5 border-t border-border py-16 px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered hydrocarbon allocation for the modern oil & gas
              industry.
            </p>
          </div>
          
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-bold mb-4 text-foreground">{group.title}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 FlowShare V2. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}