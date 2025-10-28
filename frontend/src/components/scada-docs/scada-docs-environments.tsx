import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TestTube, Rocket } from "lucide-react";

export function SCADADocsEnvironments() {
  return (
    <section id="environments">
      <Card>
        <CardHeader>
          <CardTitle>Test vs Production Environments</CardTitle>
          <CardDescription>
            FlowShare provides separate environments to safely test your
            integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3 md:p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-blue-500 shrink-0" />
                <h4 className="font-semibold text-sm md:text-base">
                  Test Environment
                </h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                {[
                  "Use test API keys for development",
                  "Data goes to separate test collection",
                  "Safe to experiment without affecting live data",
                  "Can be cleared/reset anytime",
                ].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="border rounded-lg p-3 md:p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-green-500 shrink-0" />
                <h4 className="font-semibold text-sm md:text-base">
                  Production Environment
                </h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                {[
                  "Use production API keys for live systems",
                  "Data goes to production collection",
                  "Used for actual reconciliation",
                  "Monitored and validated by AI agents",
                ].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
