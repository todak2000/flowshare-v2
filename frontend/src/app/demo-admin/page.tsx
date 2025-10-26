"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

// Demo accounts from demo.md
const DEMO_ACCOUNTS = {
  coordinator: "todak2000@gmail.com",
  partners: [
    {
      email: "hungry496@tiffincrane.com",
      name: "ABC Oil and Gas Limited",
      fieldOperator: "605azure@ptct.net",
    },
    {
      email: "semanticrobinette@tiffincrane.com",
      name: "XYZ Petroleum",
      fieldOperator: "800spotty@tiffincrane.com",
    },
  ],
  tenant: "Bomadi Terminal JV",
};

const DELETE_PASSWORD = "FlowShare@Demo2025";

// Helper to mask sensitive data in logs
const maskSensitiveData = (text: string): string => {
  // Mask UUIDs and long IDs (keep first 4 and last 4 chars)
  return text.replace(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi, (match) => {
    return `${match.substring(0, 4)}*****${match.substring(match.length - 4)}`
  }).replace(/([a-zA-Z0-9]{20,})/g, (match) => {
    // Mask other long strings (keep first 4 and last 4 chars)
    if (match.length > 12) {
      return `${match.substring(0, 4)}*****${match.substring(match.length - 4)}`
    }
    return match
  })
}

export default function DemoAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  // Data generation settings
  const [generationPeriod, setGenerationPeriod] = useState<
    "1month" | "2months" | "1year"
  >("1month");
  const [generationProgress, setGenerationProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (message: string) => {
    const maskedMessage = maskSensitiveData(message);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${maskedMessage}`,
    ]);
  };

  // Check if demo accounts exist on mount
  useEffect(() => {
    checkDemoSetup();
  }, []);

  const checkDemoSetup = async () => {
    try {
      const coordinator = await getUserByEmail(DEMO_ACCOUNTS.coordinator);
      if (
        coordinator &&
        coordinator.tenant_ids &&
        coordinator.tenant_ids.length > 0
      ) {
        setSetupComplete(true);
      } else {
        setSetupComplete(false);
      }
    } catch (error) {
      setSetupComplete(false);
    }
  };

  // Generate random production data within realistic ranges
  const generateProductionData = () => ({
    gross_volume: Math.floor(Math.random() * 5000) + 15000, // 15,000 - 20,000 bbls
    bsw_percent: (Math.random() * 3 + 0.5).toFixed(2), // 0.5% - 3.5%
    temperature: (Math.random() * 20 + 60).toFixed(1), // 60°F - 80°F
    api_gravity: (Math.random() * 10 + 30).toFixed(2), // 30 - 40 API
    pressure: Math.floor(Math.random() * 200) + 800, // 800 - 1000 PSI
    meter_factor: (Math.random() * 0.1 + 0.95).toFixed(3), // 0.95 - 1.05
  });

  // Get user data by email (direct fetch without auth)
  const getUserByEmail = async (email: string): Promise<any> => {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/auth/users/by-email?email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        console.error(
          `Failed to fetch user: ${response.status} ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to get user by email ${email}:`, error);
      return null;
    }
  };

  // Generate production entries for a date range
  const generateProductionEntries = async () => {
    // Validate password
    if (adminPassword !== DELETE_PASSWORD) {
      setMessage({
        type: "error",
        text: "Incorrect password. Cannot generate data.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    setLogs([]);
    setProgressPercent(0);
    setGenerationProgress("Starting data generation...");
    addLog("🚀 Starting data generation process...");

    try {
      // Get tenant ID first
      setGenerationProgress("Fetching coordinator data...");
      addLog("📋 Fetching coordinator account...");
      const coordinator = await getUserByEmail(DEMO_ACCOUNTS.coordinator);

      if (!coordinator) {
        throw new Error(
          `Coordinator not found with email: ${DEMO_ACCOUNTS.coordinator}`
        );
      }

      if (!coordinator.tenant_ids || coordinator.tenant_ids.length === 0) {
        throw new Error(
          `Coordinator found but has no tenant_ids. User ID: ${coordinator.id}`
        );
      }

      const tenantId = coordinator.tenant_ids[0];
      addLog(`✅ Found tenant: ${tenantId}`);

      // Calculate date range - always start from 1st of the month
      const now = new Date();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
      const startDate = new Date();

      switch (generationPeriod) {
        case "1month":
          // Start from 1st of last month
          startDate.setMonth(now.getMonth() - 1);
          startDate.setDate(1);
          break;
        case "2months":
          // Start from 1st of 2 months ago
          startDate.setMonth(now.getMonth() - 2);
          startDate.setDate(1);
          break;
        case "1year":
          // Start from 1st of 12 months ago
          startDate.setFullYear(now.getFullYear() - 1);
          startDate.setMonth(now.getMonth());
          startDate.setDate(1);
          break;
      }

      // Set time to beginning of day for start and end of day for end
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      addLog(
        `📅 Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
      );
      setGenerationProgress(
        `Generating data from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}...`
      );

      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalExpectedEntries = totalDays * DEMO_ACCOUNTS.partners.length;
      let totalEntries = 0;

      addLog(
        `📊 Will generate ${totalExpectedEntries} entries (${totalDays} days × ${DEMO_ACCOUNTS.partners.length} partners)`
      );

      // Generate data for each partner
      for (
        let partnerIndex = 0;
        partnerIndex < DEMO_ACCOUNTS.partners.length;
        partnerIndex++
      ) {
        const partner = DEMO_ACCOUNTS.partners[partnerIndex];
        setGenerationProgress(
          `Processing ${partner.name}... (Partner ${partnerIndex + 1}/${
            DEMO_ACCOUNTS.partners.length
          })`
        );
        addLog(`\n🏢 Processing partner: ${partner.name}`);

        // Get partner and field operator user data
        addLog(`  ├─ Fetching partner user: ${partner.email}`);
        const partnerUser = await getUserByEmail(partner.email);

        if (!partnerUser) {
          addLog(`  └─ ⚠️ Partner user not found, skipping...`);
          console.warn(`Skipping ${partner.name} - partner user not found`);
          continue;
        }

        addLog(`  ├─ Fetching field operator: ${partner.fieldOperator}`);
        const fieldOperatorUser = await getUserByEmail(partner.fieldOperator);

        if (!fieldOperatorUser) {
          addLog(`  └─ ⚠️ Field operator not found, skipping...`);
          console.warn(`Skipping ${partner.name} - field operator not found`);
          continue;
        }

        addLog(`  ├─ ✅ Users found`);
        addLog(`  └─ 📝 Generating ${totalDays} daily entries...`);

        // Generate daily entries for the date range
        const currentDate = new Date(startDate);
        let partnerEntriesCreated = 0;

        while (currentDate <= endDate) {
          const productionData = generateProductionData();

          // Format date as ISO string at noon UTC to avoid timezone issues
          const measurementDate = new Date(currentDate);
          measurementDate.setHours(12, 0, 0, 0);

          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/demo/production/entries`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  tenant_id: tenantId,
                  partner_id: partnerUser.id,
                  measurement_date: measurementDate.toISOString(),
                  ...productionData,
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            totalEntries++;
            partnerEntriesCreated++;

            // Update progress
            const percentComplete = Math.round(
              (totalEntries / totalExpectedEntries) * 100
            );
            setProgressPercent(percentComplete);

            if (totalEntries % 10 === 0) {
              setGenerationProgress(
                `Generated ${totalEntries}/${totalExpectedEntries} entries (${percentComplete}%)`
              );
              addLog(
                `     ✓ ${partnerEntriesCreated} entries created for ${partner.name}`
              );
            }
          } catch (error) {
            console.error(
              `Failed to create entry for ${currentDate.toDateString()}:`,
              error
            );
            addLog(
              `     ✗ Failed to create entry for ${currentDate.toDateString()}`
            );
          }

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }

        addLog(
          `  ✅ Completed ${partner.name}: ${partnerEntriesCreated} entries created`
        );
      }

      setProgressPercent(100);
      setGenerationProgress("");
      addLog(
        `\n✅ Generation complete! Created ${totalEntries} entries across ${DEMO_ACCOUNTS.partners.length} partners`
      );
      addLog(`🎉 All data has been auto-approved and is ready for use`);
      setMessage({
        type: "success",
        text: `Successfully generated ${totalEntries} production entries across ${DEMO_ACCOUNTS.partners.length} partners!`,
      });
    } catch (error: any) {
      console.error("Failed to generate production data:", error);
      setGenerationProgress("");
      addLog(`\n❌ Error: ${error.message}`);
      setMessage({
        type: "error",
        text: error.message || "Failed to generate production data",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete all demo data
  const deleteAllData = async () => {
    if (deletePassword !== DELETE_PASSWORD) {
      setMessage({
        type: "error",
        text: "Incorrect password. Cannot delete data.",
      });
      return;
    }

    setDeleteLoading(true);
    setMessage(null);
    setLogs([]);
    setProgressPercent(0);

    const addLog = (message: string) => {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ${message}`,
      ]);
    };

    try {
      // Get tenant ID
      addLog("🔍 Fetching coordinator data...");
      setGenerationProgress("Fetching coordinator data...");
      const coordinator = await getUserByEmail(DEMO_ACCOUNTS.coordinator);

      console.log("Coordinator data:", coordinator);

      if (!coordinator) {
        throw new Error(
          `Coordinator not found with email: ${DEMO_ACCOUNTS.coordinator}`
        );
      }

      if (!coordinator.tenant_ids || coordinator.tenant_ids.length === 0) {
        throw new Error(
          `Coordinator found but has no tenant_ids. User ID: ${coordinator.id}`
        );
      }

      const tenantId = coordinator.tenant_ids[0];
      addLog(`✅ Found tenant ID: ${tenantId}`);
      console.log("Using tenant ID:", tenantId);

      // Delete all data using bulk delete endpoint
      addLog("🗑️  Initiating bulk delete operation...");
      setGenerationProgress("Deleting all data...");
      setProgressPercent(30);

      const deleteResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/demo/delete-all-data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            password: deletePassword,
          }),
        }
      );

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.detail || "Failed to delete data");
      }

      const result = await deleteResponse.json();
      setProgressPercent(100);

      addLog(
        `✅ Deleted ${result.deleted_counts.production_entries} production entries`
      );
      addLog(
        `✅ Deleted ${result.deleted_counts.terminal_receipts} terminal receipts`
      );
      addLog(
        `✅ Deleted ${result.deleted_counts.reconciliations} reconciliations`
      );
      addLog("🎉 All data deleted successfully!");

      setGenerationProgress("");
      setDeletePassword("");
      setMessage({
        type: "success",
        text: `Successfully deleted ${result.deleted_counts.production_entries} production entries, ${result.deleted_counts.terminal_receipts} terminal receipts, and ${result.deleted_counts.reconciliations} reconciliations!`,
      });
    } catch (error: any) {
      console.error("Failed to delete data:", error);
      addLog(`❌ Error: ${error.message}`);
      setGenerationProgress("");
      setMessage({
        type: "error",
        text: error.message || "Failed to delete data",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          FlowShare Demo Admin
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate test data and manage demo environment
        </p>
      </div>

      {/* Setup Warning */}
      {setupComplete === false && (
        <Card className="mb-6 border-2 border-yellow-500 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                  Demo Accounts Not Set Up
                </h3>
                <p className="text-sm text-yellow-700/90 dark:text-yellow-400/90 mb-3">
                  The coordinator account ({DEMO_ACCOUNTS.coordinator}) was not
                  found or has no tenant. You need to create the demo accounts
                  before using this page.
                </p>
                <div className="text-sm text-yellow-700/90 dark:text-yellow-400/90">
                  <p className="font-medium mb-1">Setup Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>
                      Register coordinator account: {DEMO_ACCOUNTS.coordinator}
                    </li>
                    <li>Create tenant: "Bomadi Terminal JV"</li>
                    <li>Invite partners and field operators from demo.md</li>
                    <li>
                      Use default password "Qwerty@12345" for all accounts
                    </li>
                  </ol>
                </div>
                <Button
                  onClick={() => router.push("/auth/register")}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Go to Registration
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message Display */}
      {message && (
        <Card
          className={`mb-6 border-2 ${
            message.type === "success"
              ? "border-green-500 bg-green-500/10"
              : "border-destructive bg-destructive/10"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              )}
              <p
                className={
                  message.type === "success"
                    ? "text-green-700 dark:text-green-400"
                    : "text-destructive"
                }
              >
                {message.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Display */}
      {generationProgress && (
        <Card className="mb-6 border-2 border-primary bg-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
              <p className="text-primary font-medium">{generationProgress}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Accounts Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Demo Accounts
          </CardTitle>
          <CardDescription>
            Available test accounts (Default password: Qwerty@12345)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold mb-2">Coordinator</h3>
              <p className="text-sm text-muted-foreground">
                {DEMO_ACCOUNTS.coordinator}
              </p>
            </div>

            {DEMO_ACCOUNTS.partners.map((partner, index) => (
              <div key={index} className="rounded-lg bg-muted p-4">
                <h3 className="font-semibold mb-2">
                  Partner {index + 1}: {partner.name}
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <strong>Partner Email:</strong> {partner.email}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Field Operator:</strong> {partner.fieldOperator}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar and Logs */}
      {(loading || logs.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw
                className={`h-5 w-5 text-primary ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Generation Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-primary">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 ease-out flex items-center justify-center"
                  style={{ width: `${progressPercent}%` }}
                >
                  {progressPercent > 10 && (
                    <span className="text-xs font-semibold text-primary-foreground">
                      {progressPercent}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Logs Display */}
            <div className="rounded-lg bg-black/90 p-4 font-mono text-xs text-green-400 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
              {logs.length === 0 && (
                <div className="text-muted-foreground">
                  Waiting for operation to start...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Production Data */}
      <Card className="mb-6 border-green-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Plus className="h-5 w-5" />
            Generate Production Data
          </CardTitle>
          <CardDescription>
            Mass generate realistic production entries for testing (password-protected)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminPassword">Admin Password</Label>
            <Input
              id="adminPassword"
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              disabled={loading || deleteLoading}
            />
            <p className="text-xs text-muted-foreground">
              Password required to prevent accidental data generation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Time Period</Label>
            <Select
              value={generationPeriod}
              onValueChange={(value: any) => setGenerationPeriod(value)}
            >
              <SelectTrigger id="period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">
                  Last 1 Month (~60 entries)
                </SelectItem>
                <SelectItem value="2months">
                  Last 2 Months (~120 entries)
                </SelectItem>
                <SelectItem value="1year">
                  Last 1 Year (~730 entries)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-semibold mb-2">What will be generated:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Daily production entries for ALL partners</li>
              <li>
                • Realistic values: gross volume, BSW%, temperature, API
                gravity, pressure
              </li>
              <li>• Data for both ABC Oil and Gas Limited and XYZ Petroleum</li>
              <li>
                • Entries created under respective field operator accounts
              </li>
              <li>• All entries auto-approved and ready for reconciliation</li>
            </ul>
          </div>

          <Button
            onClick={generateProductionEntries}
            disabled={!adminPassword || loading || deleteLoading}
            className="w-full"
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "Generating..." : "Generate Production Data"}
          </Button>
        </CardContent>
      </Card>

      {/* Delete All Data */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone: Delete All Demo Data
          </CardTitle>
          <CardDescription>
            Remove all production entries, terminal receipts, and reconciliation
            records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive p-4">
            <p className="text-sm text-destructive font-medium mb-2">
              ⚠️ Warning: This action cannot be undone!
            </p>
            <p className="text-sm text-muted-foreground">
              This will permanently delete:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mt-2">
              <li>• All production entries</li>
              <li>• All terminal receipts</li>
              <li>• All reconciliation records and reports</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deletePassword">Enter Password to Confirm</Label>
            <Input
              id="deletePassword"
              type="password"
              placeholder="Enter deletion password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              disabled={deleteLoading || loading}
            />
          </div>

          <Button
            onClick={deleteAllData}
            disabled={!deletePassword || deleteLoading || loading}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteLoading ? "Deleting..." : "Delete All Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
