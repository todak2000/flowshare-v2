"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropletIcon,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ProductionEntryStatus } from "@/types/production";
import { TerminalReceipt } from "@/types/reconciliation";
import { FormField, StatusBanner } from "./components";
import {
  formatDateForAPI,
  formatReceiptDisplayDate,
  getLastDayOfMonth,
  getMonthRange,
  getPast12MonthsOptions,
} from "@/lib/utils";

// --- Main Component ---
interface TerminalReceiptFormProps {
  tenantId: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

interface ExistingReceiptCheck {
  checking: boolean;
  exists: boolean;
  receiptId?: string;
}

export function TerminalReceiptForm({
  tenantId,
  onSubmit,
  onCancel,
}: TerminalReceiptFormProps) {
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);
  const [existingReceiptCheck, setExistingReceiptCheck] =
    useState<ExistingReceiptCheck>({
      checking: false,
      exists: false,
    });

  const [formData, setFormData] = useState({
    terminal_volume: "",
    terminal_name: "",
    operator_name: "",
    notes: "",
  });

  const MONTH_OPTIONS = getPast12MonthsOptions();

  const getReceiptDate = () => {
    const now = new Date();
    return getLastDayOfMonth(
      now.getFullYear(),
      now.getMonth() + selectedMonthOffset
    );
  };

  const getMonthDateRange = () => {
    const now = new Date();
    return getMonthRange(
      now.getFullYear(),
      now.getMonth() + selectedMonthOffset
    );
  };

  const getSelectedMonthDisplay = () => {
    return formatReceiptDisplayDate(getReceiptDate());
  };

  const getSelectedMonthYear = () => {
    const now = new Date();
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth() + selectedMonthOffset,
      1
    );
    return {
      monthName: targetDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  };

  //   // --- Existing receipt check ---
  const checkExistingReceipt = async () => {
    setExistingReceiptCheck({ checking: true, exists: false });
    try {
      const { startDate, endDate } = getMonthDateRange();
      const receipts = await apiClient.get<{ data: TerminalReceipt[] }>(
        `/api/terminal-receipts/filtered?tenant_id=${tenantId}&start_date=${formatDateForAPI(
          startDate
        )}&end_date=${formatDateForAPI(endDate)}&limit=100`
      );

      if (receipts.data.length > 0) {
        const { monthName } = getSelectedMonthYear();
        setExistingReceiptCheck({
          checking: false,
          exists: true,
          receiptId: receipts.data[0].id,
        });
        setValidationError(
          `Reconciliation for ${monthName} has already been completed. A terminal receipt already exists for this period. Please view the existing reconciliation report instead of creating a new one.`
        );
      } else {
        setExistingReceiptCheck({ checking: false, exists: false });
        setValidationError("");
      }
    } catch (error) {
      console.error("Failed to check existing receipts:", error);
      setExistingReceiptCheck({ checking: false, exists: false });
    }
  };

  useEffect(() => {
    if (tenantId) checkExistingReceipt();
  }, [selectedMonthOffset, tenantId]);

  // --- Approval validation ---
  const validateApprovalRate = async () => {
    try {
      const { startDate, endDate } = getMonthDateRange();
      const res = await apiClient.get<any>(
        `/api/production/entries?tenant_id=${tenantId}&start_date=${formatDateForAPI(
          startDate
        )}&end_date=${formatDateForAPI(endDate)}&limit=1000`
      );

      const totalEntries = res.entries?.length || 0;
      if (totalEntries === 0) {
        return {
          valid: false,
          message:
            "No production entries found for the selected period. Production data must be submitted before reconciliation.",
        };
      }

      const approvedEntries = res.entries.filter(
        (entry: any) => entry.status === ProductionEntryStatus.APPROVED
      ).length;

      const approvalPercentage = (approvedEntries / totalEntries) * 100;
      if (approvalPercentage < 90) {
        return {
          valid: false,
          message: `Insufficient approved production data for reconciliation. Only ${approvedEntries} out of ${totalEntries} entries (${approvalPercentage.toFixed(
            1
          )}%) are approved. At least 90% of production data must be approved before reconciliation can proceed.`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: "Failed to validate production data. Please try again.",
      };
    }
  };

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingReceiptCheck.exists) return;

    setLoading(true);
    setValidationError("");

    try {
      const validation = await validateApprovalRate();
      if (!validation.valid) {
        setValidationError(validation.message || "Validation failed");
        return;
      }

      const receiptDate = getReceiptDate();
      await onSubmit({
        tenant_id: tenantId,
        receipt_date: receiptDate.toISOString(),
        terminal_volume: parseFloat(formData.terminal_volume),
        terminal_name: formData.terminal_name || undefined,
        operator_name: formData.operator_name || undefined,
        notes: formData.notes || undefined,
      });

      setFormData({
        terminal_volume: "",
        terminal_name: "",
        operator_name: "",
        notes: "",
      });
      setSelectedMonthOffset(0);
      setValidationError("");
    } catch (error: any) {
      setValidationError(
        error.response?.data?.detail || "Failed to submit terminal receipt"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonthOffset(parseInt(e.target.value));
  };

  // --- FIELD CONFIGURATION (DATA-DRIVEN) ---
  const formFields = [
    {
      name: "receipt_month",
      label: "Receipt Month",
      type: "select" as const,
      required: true,
      info: `Receipt date: ${getSelectedMonthDisplay()}`,
    },
    {
      name: "terminal_volume",
      label: "Terminal Volume (bbls)",
      type: "input" as const,
      required: true,
      placeholder: "e.g., 50000.00",
      inputType: "number",
      step: "0.01",
    },
    {
      name: "terminal_name",
      label: "Terminal Name",
      type: "input" as const,
      required: false,
      placeholder: "e.g., Terminal A",
      inputType: "text",
    },
    {
      name: "operator_name",
      label: "Operator Name",
      type: "input" as const,
      required: false,
      placeholder: "e.g., John Doe",
      inputType: "text",
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea" as const,
      required: false,
      placeholder: "Any additional notes about this receipt...",
      rows: 3,
    },
  ];

  // --- RENDER FIELD BASED ON TYPE ---
  const renderField = (field: (typeof formFields)[number]) => {
    switch (field.type) {
      case "select":
        return (
          <select
            id={field.name}
            value={selectedMonthOffset}
            onChange={handleMonthChange}
            disabled={existingReceiptCheck.checking}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required={field.required}
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "textarea":
        return (
          <Textarea
            id={field.name}
            name={field.name}
            value={formData[field.name as keyof typeof formData] || ""}
            onChange={handleChange}
            placeholder={field.placeholder}
            rows={field.rows}
          />
        );

      case "input":
        return (
          <Input
            id={field.name}
            name={field.name}
            type={field.inputType}
            step={field.step}
            placeholder={field.placeholder}
            value={formData[field.name as keyof typeof formData] || ""}
            onChange={handleChange}
            required={field.required}
          />
        );

      default:
        return null;
    }
  };

  // --- Render ---
  const { monthName } = getSelectedMonthYear();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DropletIcon className="h-5 w-5 text-primary" />
          Record Terminal Receipt
        </CardTitle>
        <CardDescription>
          Enter the terminal volume received to trigger reconciliation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Banners */}
          {existingReceiptCheck.checking && (
            <div className="rounded-lg bg-muted border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">
                  Checking for existing terminal receipt...
                </p>
              </div>
            </div>
          )}

          {!existingReceiptCheck.checking && !existingReceiptCheck.exists && (
            <StatusBanner
              variant="success"
              icon={CheckCircle2}
              title="Ready to Submit"
            >
              No existing receipt found for {monthName}. You can proceed with
              submission.
            </StatusBanner>
          )}

          {validationError && (
            <StatusBanner
              variant="error"
              icon={AlertTriangle}
              title={
                existingReceiptCheck.exists
                  ? "Reconciliation Already Completed"
                  : "Validation Failed"
              }
            >
              {validationError}
            </StatusBanner>
          )}

          {/* Grid Fields (first 4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formFields.slice(0, 4).map((field) => (
              <FormField
                key={field.name}
                label={field.label}
                htmlFor={field.name}
                required={field.required}
                info={field.info}
              >
                {renderField(field)}
              </FormField>
            ))}
          </div>

          {/* Full-width Notes */}
          <FormField
            label={formFields[4].label}
            htmlFor={formFields[4].name}
            required={formFields[4].required}
          >
            {renderField(formFields[4])}
          </FormField>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                loading ||
                existingReceiptCheck.checking ||
                existingReceiptCheck.exists
              }
            >
              {loading
                ? "Submitting..."
                : existingReceiptCheck.checking
                ? "Checking..."
                : existingReceiptCheck.exists
                ? "Reconciliation Already Completed"
                : "Submit Terminal Receipt"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
