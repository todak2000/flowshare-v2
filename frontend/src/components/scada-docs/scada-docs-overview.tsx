import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Book } from "lucide-react";

export function SCADADocsOverview() {
  return (
    <section id="overview">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The FlowShare SCADA API allows you to automatically submit
            production data from your SCADA systems, IoT devices, or any
            automated system without requiring user authentication.
          </p>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">Base URL</h4>
            <code className="block bg-background px-3 py-2 rounded border">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
            </code>
          </div>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">Endpoint</h4>
            <code className="block bg-background px-3 py-2 rounded border">
              POST /api/scada/production
            </code>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
