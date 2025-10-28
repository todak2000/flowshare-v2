"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Book,
  Code,
  Play,
  CheckCircle,
  XCircle,
  Copy,
  TestTube,
  Rocket,
  Zap,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatDetailError } from "@/lib/utils";

export default function SCADADocsPage() {
  const { user } = useAuthStore();
  const [selectedLanguage, setSelectedLanguage] = useState("curl");
  const [testApiKey, setTestApiKey] = useState("");
  const [testPartnerId, setTestPartnerId] = useState("");
  const [partners, setPartners] = useState<
    Array<{ id: string; name: string; organization?: string }>
  >([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [testData, setTestData] = useState({
    gross_volume: "1000.5",
    bsw_percent: "2.5",
    temperature: "60.0",
    api_gravity: "35.0",
  });
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Fetch partners list for coordinators
  useEffect(() => {
    const fetchPartners = async () => {
      if (!user) return;

      // For coordinators, fetch all partners
      if (user.role === "coordinator") {
        setLoadingPartners(true);
        try {
          const tenantId = user.tenant_ids[0];
          const data = await apiClient.get<any[]>(
            `/api/partners?tenant_id=${tenantId}`
          );
          const mappedPartners = data
            .filter((p) => p.role === "partner")
            .map((p) => ({
              id: p.id,
              name: p.full_name || p.name,
              organization: p.organization,
            }));
          setPartners(mappedPartners);
        } catch (error) {
          console.error("Failed to fetch partners:", error);
        } finally {
          setLoadingPartners(false);
        }
      } else if (user.partner_id) {
        // For partners, auto-populate with their partner_id
        setTestPartnerId(user.partner_id);
      }
    };

    fetchPartners();
  }, [user]);

  const handleTestAPI = async () => {
    if (!testApiKey || !testPartnerId) {
      setTestError("Please provide an API key and partner ID");
      return;
    }

    setTesting(true);
    setTestError(null);
    setTestResponse(null);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/scada/production`,
        {
          method: "POST",
          headers: {
            "X-API-Key": testApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            partner_id: testPartnerId,
            gross_volume: parseFloat(testData.gross_volume),
            bsw_percent: parseFloat(testData.bsw_percent),
            temperature: parseFloat(testData.temperature),
            api_gravity: parseFloat(testData.api_gravity),
            measurement_date: new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setTestError(
          `Error ${response.status}: ${
            formatDetailError(data.detail) || "Unknown error"
          }`
        );
      } else {
        setTestResponse(data);
      }
    } catch (error: any) {
      setTestError(error.message || "Failed to connect to API");
    } finally {
      setTesting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  // Generate code examples with actual values when available
  const getCodeExamples = () => {
    const apiKey = testApiKey || "YOUR_API_KEY_HERE";
    const partnerId = testPartnerId || "your-partner-id";
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    return {
      curl: `curl -X POST "${baseUrl}/api/scada/production" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "partner_id": "${partnerId}",
    "gross_volume": ${testData.gross_volume},
    "bsw_percent": ${testData.bsw_percent},
    "temperature": ${testData.temperature},
    "api_gravity": ${testData.api_gravity},
    "measurement_date": "2025-10-27T12:00:00Z"
  }'`,
      python: `import requests
from datetime import datetime, timezone

API_KEY = "${apiKey}"
BASE_URL = "${baseUrl}"

def submit_production_data(partner_id, gross_volume, bsw_percent, temperature, api_gravity):
    """Submit production data to FlowShare SCADA API"""

    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "partner_id": partner_id,
        "gross_volume": gross_volume,
        "bsw_percent": bsw_percent,
        "temperature": temperature,
        "api_gravity": api_gravity,
        "measurement_date": datetime.now(timezone.utc).isoformat()
    }

    response = requests.post(
        f"{BASE_URL}/api/scada/production",
        headers=headers,
        json=payload
    )

    response.raise_for_status()
    return response.json()

# Example usage
result = submit_production_data(
    partner_id="${partnerId}",
    gross_volume=${testData.gross_volume},
    bsw_percent=${testData.bsw_percent},
    temperature=${testData.temperature},
    api_gravity=${testData.api_gravity}
)
print(f"Created entry: {result['id']}")`,
      javascript: `// Node.js / JavaScript example
const axios = require('axios');

const API_KEY = '${apiKey}';
const BASE_URL = '${baseUrl}';

async function submitProductionData(partnerId, grossVolume, bswPercent, temperature, apiGravity) {
  try {
    const response = await axios.post(
      \`\${BASE_URL}/api/scada/production\`,
      {
        partner_id: partnerId,
        gross_volume: grossVolume,
        bsw_percent: bswPercent,
        temperature: temperature,
        api_gravity: apiGravity,
        measurement_date: new Date().toISOString()
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Entry created:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('Error submitting data:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
submitProductionData('${partnerId}', ${testData.gross_volume}, ${testData.bsw_percent}, ${testData.temperature}, ${testData.api_gravity});`,
    };
  };

  const codeExamples = getCodeExamples();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-lg md:text-3xl font-bold mb-2">
                SCADA API Documentation
              </h1>
              <p className="text-xs md:text-base my-3 text-muted-foreground">
                Connect your SCADA systems to FlowShare in minutes
              </p>
            </div>
            <Link href="/dashboard/scada-setup">
              <Button>
                <Zap className="mr-2 h-4 w-4" />
                Setup & Manage Keys
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-sm">On This Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <a
                  href="#overview"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-3 w-3" />
                  Overview
                </a>
                <a
                  href="#environments"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-3 w-3" />
                  Test vs Production
                </a>
                <a
                  href="#authentication"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-3 w-3" />
                  Authentication
                </a>
                <a
                  href="#test"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-3 w-3" />
                  Interactive Testing
                </a>
                <a
                  href="#examples"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-3 w-3" />
                  Code Examples
                </a>
                <a
                  href="#reference"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-3 w-3" />
                  API Reference
                </a>
                <a
                  href="#errors"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-3 w-3" />
                  Error Handling
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Full width on mobile */}
          <div className="lg:col-span-3 space-y-6 md:space-y-8">
            {/* Overview */}
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
                      {process.env.NEXT_PUBLIC_API_URL ||
                        "http://localhost:8000"}
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

            {/* Test vs Production */}
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
                        <h4 className="font-semibold text-sm md:text-base">Test Environment</h4>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Use test API keys for development</li>
                        <li>Data goes to separate test collection</li>
                        <li>Safe to experiment without affecting live data</li>
                        <li>Can be cleared/reset anytime</li>
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
                        <li>Use production API keys for live systems</li>
                        <li>Data goes to production collection</li>
                        <li>Used for actual reconciliation</li>
                        <li>Monitored and validated by AI agents</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Authentication */}
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
                    <code className="bg-muted px-2 py-1 rounded">
                      X-API-Key
                    </code>{" "}
                    header of every request.
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
                        onChange={(e) => setTestApiKey(e.target.value)}
                        className="flex-1 border-0 bg-background/50 font-mono text-sm h-8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste your API key above to see it in the code examples
                      below
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Security Warning</p>
                        <p className="text-muted-foreground mt-1">
                          Never share your API keys or commit them to version
                          control. Store them securely in environment variables
                          or a secrets manager.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Interactive Testing */}
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
                        onChange={(e) => setTestApiKey(e.target.value)}
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
                      {user?.role === "coordinator" ? (
                        <Select
                          value={testPartnerId}
                          onValueChange={setTestPartnerId}
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
                      {user?.role !== "coordinator" && (
                        <p className="text-xs text-muted-foreground">
                          Using your partner ID
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Gross Volume (BBL)</Label>
                      <Input
                        type="number"
                        value={testData.gross_volume}
                        onChange={(e) =>
                          setTestData({
                            ...testData,
                            gross_volume: e.target.value,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">BSW %</Label>
                      <Input
                        type="number"
                        value={testData.bsw_percent}
                        onChange={(e) =>
                          setTestData({
                            ...testData,
                            bsw_percent: e.target.value,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Temperature (°F)</Label>
                      <Input
                        type="number"
                        value={testData.temperature}
                        onChange={(e) =>
                          setTestData({
                            ...testData,
                            temperature: e.target.value,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">API Gravity</Label>
                      <Input
                        type="number"
                        value={testData.api_gravity}
                        onChange={(e) =>
                          setTestData({
                            ...testData,
                            api_gravity: e.target.value,
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleTestAPI}
                    disabled={testing}
                    className="w-max md:w-full"
                  >
                    {testing ? "Testing..." : "Test API Call"}
                  </Button>

                  {testError && (
                    <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 rounded-lg p-5">
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
                              copyCode(JSON.stringify(testResponse, null, 2))
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
                              {"\n  "}
                              <span className="text-blue-400">"id"</span>:{" "}
                              <span className="text-green-400">
                                "{testResponse.id}"
                              </span>
                              ,{"\n  "}
                              <span className="text-blue-400">"tenant_id"</span>
                              :{" "}
                              <span className="text-green-400">
                                "{testResponse.tenant_id}"
                              </span>
                              ,{"\n  "}
                              <span className="text-blue-400">
                                "partner_id"
                              </span>
                              :{" "}
                              <span className="text-green-400">
                                "{testResponse.partner_id}"
                              </span>
                              ,{"\n  "}
                              <span className="text-blue-400">
                                "gross_volume"
                              </span>
                              :{" "}
                              <span className="text-amber-400">
                                {testResponse.gross_volume}
                              </span>
                              ,{"\n  "}
                              <span className="text-blue-400">
                                "bsw_percent"
                              </span>
                              :{" "}
                              <span className="text-amber-400">
                                {testResponse.bsw_percent}
                              </span>
                              ,{"\n  "}
                              <span className="text-blue-400">
                                "temperature"
                              </span>
                              :{" "}
                              <span className="text-amber-400">
                                {testResponse.temperature}
                              </span>
                              ,{"\n  "}
                              <span className="text-blue-400">
                                "api_gravity"
                              </span>
                              :{" "}
                              <span className="text-amber-400">
                                {testResponse.api_gravity}
                              </span>
                              ,{"\n  "}
                              <span className="text-blue-400">
                                "status"
                              </span>:{" "}
                              <span className="text-green-400">
                                "{testResponse.status}"
                              </span>
                              ,{"\n  "}
                              <span className="text-blue-400">
                                "environment"
                              </span>
                              :{" "}
                              <span className="text-green-400">
                                "{testResponse.environment}"
                              </span>
                              ,{"\n  "}
                              <span className="text-blue-400">
                                "created_at"
                              </span>
                              :{" "}
                              <span className="text-green-400">
                                "{testResponse.created_at}"
                              </span>
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

            {/* Code Examples */}
            <section id="examples">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Examples
                  </CardTitle>
                  <CardDescription>
                    Integration examples in multiple programming languages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs
                    value={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                  >
                    <TabsList>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    </TabsList>
                    {Object.entries(codeExamples).map(([lang, code]) => (
                      <TabsContent key={lang} value={lang}>
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => copyCode(code)}
                          >
                            <Copy className="h-3 w-3 mr-2" />
                            Copy
                          </Button>
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                            <code>{code}</code>
                          </pre>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </section>

            {/* API Reference */}
            <section id="reference">
              <Card>
                <CardHeader>
                  <CardTitle>API Reference</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">
                      Request Body Parameters
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          name: "partner_id",
                          type: "string",
                          required: true,
                          description: "ID of the partner submitting data",
                        },
                        {
                          name: "gross_volume",
                          type: "number",
                          required: true,
                          description: "Gross volume in barrels",
                        },
                        {
                          name: "bsw_percent",
                          type: "number",
                          required: true,
                          description: "Basic Sediment & Water percentage",
                        },
                        {
                          name: "temperature",
                          type: "number",
                          required: true,
                          description: "Temperature in °F",
                        },
                        {
                          name: "api_gravity",
                          type: "number",
                          required: true,
                          description: "API gravity",
                        },
                        {
                          name: "measurement_date",
                          type: "string",
                          required: true,
                          description:
                            "ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ)",
                        },
                      ].map((param) => (
                        <div
                          key={param.name}
                          className="border-l-2 border-primary pl-3"
                        >
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">
                              {param.name}
                            </code>
                            <span className="text-xs text-muted-foreground">
                              {param.type}
                            </span>
                            {param.required && (
                              <span className="text-xs text-destructive">
                                required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {param.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">
                      Response (201 Created)
                    </h4>
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="text-sm overflow-x-auto">
                        {`{
  "id": "entry-uuid",
  "tenant_id": "tenant-id",
  "partner_id": "partner-123",
  "gross_volume": 1000.5,
  "bsw_percent": 2.5,
  "temperature": 60.0,
  "api_gravity": 35.0,
  "measurement_date": "2025-10-27T12:00:00Z",
  "status": "pending",
  "environment": "test",
  "created_at": "2025-10-27T12:01:00Z",
  "created_by": "scada_api"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Error Handling */}
            <section id="errors">
              <Card>
                <CardHeader>
                  <CardTitle>Error Handling</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        code: 401,
                        title: "Unauthorized",
                        description: "Invalid or missing API key",
                      },
                      {
                        code: 403,
                        title: "Forbidden",
                        description: "API key is revoked or expired",
                      },
                      {
                        code: 404,
                        title: "Not Found",
                        description: "Partner ID does not exist",
                      },
                      {
                        code: 422,
                        title: "Validation Error",
                        description:
                          "Invalid data format or missing required fields",
                      },
                      {
                        code: 500,
                        title: "Internal Server Error",
                        description: "Server error - contact support",
                      },
                    ].map((error) => (
                      <div
                        key={error.code}
                        className="border-l-2 border-destructive pl-3"
                      >
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-bold">
                            {error.code}
                          </code>
                          <span className="font-semibold">{error.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {error.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
