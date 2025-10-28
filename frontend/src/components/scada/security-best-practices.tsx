"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CheckCircle, AlertCircle } from "lucide-react"

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
              <li>Store API keys in environment variables</li>
              <li>Use test keys during development</li>
              <li>Rotate production keys periodically</li>
              <li>Monitor API key usage in the logs</li>
              <li>Revoke unused or compromised keys immediately</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Don't
            </h4>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Never commit API keys to version control</li>
              <li>Don't share keys via email or chat</li>
              <li>Don't use production keys for testing</li>
              <li>Don't hardcode keys in your application</li>
              <li>Don't reuse keys across environments</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
