"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

export function SecurityBestPractices() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Best Practices
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Do
            </h4>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              {[
                "Store API keys in environment variables",
                "Use test keys during development",
                "Rotate production keys periodically",
                "Monitor API key usage in the logs",
                "Revoke unused or compromised keys immediately",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Don't
            </h4>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              {[
                "Never commit API keys to version control",
                "Don't share keys via email or chat",
                "Don't use production keys for testing",
                "Don't hardcode keys in your application",
                "Don't reuse keys across environments",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
