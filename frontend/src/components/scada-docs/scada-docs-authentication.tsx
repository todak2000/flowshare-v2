import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface SCADADocsAuthenticationProps {
  testApiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function SCADADocsAuthentication({
  testApiKey,
  onApiKeyChange,
}: SCADADocsAuthenticationProps) {
  return (
    <section id="authentication">
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            All SCADA API requests require an API key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Include your API key in the{" "}
            <code className="bg-muted px-2 py-1 rounded">X-API-Key</code> header
            of every request.
          </p>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Example Header Format
            </Label>
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2 font-mono text-sm">
              <span className="text-muted-foreground select-none">
                X-API-Key:
              </span>
              <Input
                type="text"
                placeholder="your-api-key-here"
                value={testApiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                className="flex-1 border-0 bg-background/50 font-mono text-sm h-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Paste your API key above to see it in the code examples below
            </p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Security Warning</p>
                <p className="text-muted-foreground mt-1">
                  Never share your API keys or commit them to version control.
                  Store them securely in environment variables or a secrets
                  manager.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
