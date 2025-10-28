import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, CheckCircle, XCircle, Copy } from "lucide-react";
import {
  RESPONSE_FIELDS,
  SCADADocsInteractiveTestProps,
  TEST_DATA_FIELDS,
} from "./constants";

// Data-driven field configurations

export function SCADADocsInteractiveTest({
  testApiKey,
  onApiKeyChange,
  testPartnerId,
  onPartnerIdChange,
  partners,
  loadingPartners,
  testData,
  onTestDataChange,
  testResponse,
  testing,
  testError,
  onTestAPI,
  onCopyCode,
  userRole,
}: SCADADocsInteractiveTestProps) {
  return (
    <section id="test">
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Interactive API Testing
          </CardTitle>
          <CardDescription>
            Test the API directly from your browser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Test API Key</Label>
              <Input
                type="password"
                placeholder="Paste your test API key here"
                value={testApiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Don't have one?{" "}
                <Link
                  href="/dashboard/scada-setup"
                  className="text-primary hover:underline"
                >
                  Create a test API key
                </Link>
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Partner ID</Label>
              {userRole === "coordinator" ? (
                <Select
                  value={testPartnerId}
                  onValueChange={onPartnerIdChange}
                  disabled={loadingPartners}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue
                      placeholder={
                        loadingPartners
                          ? "Loading partners..."
                          : "Select a partner"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.organization || partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Partner ID"
                  value={testPartnerId}
                  disabled
                  className="bg-muted"
                />
              )}
              {userRole !== "coordinator" && (
                <p className="text-xs text-muted-foreground">
                  Using your partner ID
                </p>
              )}
            </div>
          </div>

          {/* Data-driven test data fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {TEST_DATA_FIELDS.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="text-sm font-medium">{field.label}</Label>
                <Input
                  type="number"
                  value={testData[field.key]}
                  onChange={(e) =>
                    onTestDataChange({
                      ...testData,
                      [field.key]: e.target.value,
                    })
                  }
                  className="text-sm"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={onTestAPI}
            disabled={testing}
            className="w-max md:w-full"
          >
            {testing ? "Testing..." : "Test API Call"}
          </Button>

          {/* Error Display */}
          {testError && (
            <div className="bg-black border-2 border-red-200 dark:border-red-900 rounded-lg p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-full bg-red-100 dark:bg-red-900/40 p-2">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    Request Failed
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {testError}
                  </p>
                </div>
              </div>
              <div className="bg-red-900/10 dark:bg-red-950/40 rounded-lg p-3 border border-red-200 dark:border-red-900">
                <pre className="text-xs font-mono text-red-800 dark:text-red-200 overflow-x-auto whitespace-pre-wrap">
                  {testError}
                </pre>
              </div>
            </div>
          )}

          {/* Success Response Display */}
          {testResponse && (
            <div className="bg-black border-2 border-green-200 dark:border-green-900 rounded-lg p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                    Success!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Production data submitted successfully • Entry ID:{" "}
                    <code className="bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded text-xs">
                      {testResponse.id}
                    </code>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-green-700 dark:text-green-300 font-semibold">
                    Response Body
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      onCopyCode(JSON.stringify(testResponse, null, 2))
                    }
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-slate-950 dark:bg-slate-900 rounded-lg p-4 border border-green-200 dark:border-green-900 overflow-x-auto">
                  <pre className="text-xs font-mono">
                    <code className="language-json">
                      <span className="text-slate-400">{"{"}</span>
                      {RESPONSE_FIELDS.map((field, index) => (
                        <span key={field.key}>
                          {"\n  "}
                          <span className="text-blue-400">
                            "{field.key}"
                          </span>:{" "}
                          {field.type === "string" ? (
                            <span className="text-green-400">
                              "{testResponse[field.key]}"
                            </span>
                          ) : (
                            <span className="text-amber-400">
                              {testResponse[field.key]}
                            </span>
                          )}
                          {index < RESPONSE_FIELDS.length - 1 && ","}
                        </span>
                      ))}
                      {"\n"}
                      <span className="text-slate-400">{"}"}</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
