import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export function SCADADocsSidebar() {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-sm">On This Page</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {[
          { href: "#overview", label: "Overview" },
          { href: "#environments", label: "Test vs Production" },
          { href: "#authentication", label: "Authentication" },
          { href: "#test", label: "Interactive Testing" },
          { href: "#examples", label: "Code Examples" },
          { href: "#reference", label: "API Reference" },
          { href: "#errors", label: "Error Handling" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-3 w-3" />
            {item.label}
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
