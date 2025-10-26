"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { ProductionEntryCreate } from "@/types/production";
import { Loader2 } from "lucide-react";

interface ProductionEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  measurement_date: string;
  gross_volume: string;
  bsw_percent: string;
  temperature: string;
  api_gravity: string;
  pressure: string;
  meter_factor: string;
}

interface FormErrors {
  measurement_date?: string;
  gross_volume?: string;
  bsw_percent?: string;
  temperature?: string;
  api_gravity?: string;
  pressure?: string;
  meter_factor?: string;
  submit?: string;
}

const formatDateToISO = (dateString: string): string => {
  const date = new Date(dateString);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};

export function ProductionEntryModal({
  open,
  onOpenChange,
  onSuccess,
}: ProductionEntryModalProps) {
  const { getTenantId, getUserRole, user } = useAuthStore();
  const userRole = getUserRole() || "";
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData>({
    measurement_date: new Date().toISOString().split("T")[0],
    gross_volume: "",
    bsw_percent: "",
    temperature: "",
    api_gravity: "",
    pressure: "",
    meter_factor: "1.0",
  });
  const [errors, setErrors] = React.useState<FormErrors>({});

  // Real-time validation
  const validateField = (
    name: keyof FormData,
    value: string
  ): string | undefined => {
    switch (name) {
      case "measurement_date":
        if (!value) return "Measurement date is required";
        const date = new Date(value);
        if (date > new Date()) return "Date cannot be in the future";
        return undefined;

      case "gross_volume":
        if (!value) return "Gross volume is required";
        const volume = parseFloat(value);
        if (isNaN(volume) || volume <= 0) return "Must be a positive number";
        if (volume > 1000000) return "Volume seems unusually high";
        return undefined;

      case "bsw_percent":
        if (!value) return "BSW percentage is required";
        const bsw = parseFloat(value);
        if (isNaN(bsw) || bsw < 0 || bsw > 100)
          return "Must be between 0 and 100";
        return undefined;

      case "temperature":
        if (!value) return "Temperature is required";
        const temp = parseFloat(value);
        if (isNaN(temp)) return "Must be a valid number";
        if (temp < -50 || temp > 300) return "Temperature out of normal range";
        return undefined;

      case "api_gravity":
        if (!value) return "API gravity is required";
        const api = parseFloat(value);
        if (isNaN(api) || api < 0 || api > 100)
          return "Must be between 0 and 100";
        return undefined;

      case "pressure":
        if (value) {
          const pressure = parseFloat(value);
          if (isNaN(pressure) || pressure < 0)
            return "Must be a positive number";
        }
        return undefined;

      case "meter_factor":
        if (!value) return "Meter factor is required";
        const mf = parseFloat(value);
        if (isNaN(mf) || mf <= 0) return "Must be a positive number";
        if (mf < 0.5 || mf > 2.0)
          return "Meter factor typically between 0.5 and 2.0";
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    const error = validateField(name as keyof FormData, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
      submit: undefined, // Clear submit error when user makes changes
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(
        key as keyof FormData,
        formData[key as keyof FormData]
      );
      if (!user?.partner_id && userRole !== "coordinator") {
        newErrors.submit = "Partner ID is missing. Please contact support.";
      }
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const extractErrorMessage = (error: any): string => {
    const detail = error.response?.data?.detail;

    if (Array.isArray(detail)) {
      // Pydantic v2 error format
      return detail
        .map((err: any) => {
          const field = err.loc?.[1] || "Field";
          return `${field}: ${err.msg}`;
        })
        .join("; ");
    }

    if (typeof detail === "string") {
      return detail;
    }

    return "Failed to create entry. Please check your input and try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      setErrors({ submit: "No tenant ID found. Please log in again." });
      return;
    }

    if (!user?.id) {
      setErrors({ submit: "User information not found. Please log in again." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload: ProductionEntryCreate = {
        tenant_id: tenantId,
        partner_id: user.partner_id || user.id, // Use partner_id if available, otherwise user id
        measurement_date: formatDateToISO(formData.measurement_date),
        gross_volume: parseFloat(formData.gross_volume),
        bsw_percent: parseFloat(formData.bsw_percent),
        temperature: parseFloat(formData.temperature),
        api_gravity: parseFloat(formData.api_gravity),
        pressure: formData.pressure ? parseFloat(formData.pressure) : undefined,
        meter_factor: parseFloat(formData.meter_factor),
      };

      await apiClient.post("/api/production/entries", payload);

      // Reset form
      setFormData({
        measurement_date: new Date().toISOString().split("T")[0],
        gross_volume: "",
        bsw_percent: "",
        temperature: "",
        api_gravity: "",
        pressure: "",
        meter_factor: "1.0",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to create production entry:", error);

      // Then in handleSubmit:
      setErrors({
        submit: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Production Entry</DialogTitle>
          <DialogDescription>
            Enter production data for oil measurement. All fields marked with *
            are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info about today's date */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Date:</strong> {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Production entries are automatically recorded for today's date
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">

            {/* Gross Volume */}
            <div>
              <Label htmlFor="gross_volume">
                Gross Volume (BBL) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gross_volume"
                name="gross_volume"
                type="number"
                step="0.01"
                placeholder="e.g., 1250.50"
                value={formData.gross_volume}
                onChange={handleChange}
                className={errors.gross_volume ? "border-destructive" : ""}
              />
              {errors.gross_volume && (
                <p className="text-sm text-destructive mt-1">
                  {errors.gross_volume}
                </p>
              )}
            </div>

            {/* BSW Percent */}
            <div>
              <Label htmlFor="bsw_percent">
                BSW % <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bsw_percent"
                name="bsw_percent"
                type="number"
                step="0.01"
                placeholder="e.g., 2.5"
                value={formData.bsw_percent}
                onChange={handleChange}
                className={errors.bsw_percent ? "border-destructive" : ""}
              />
              {errors.bsw_percent && (
                <p className="text-sm text-destructive mt-1">
                  {errors.bsw_percent}
                </p>
              )}
            </div>

            {/* Temperature */}
            <div>
              <Label htmlFor="temperature">
                Temperature (°F) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="temperature"
                name="temperature"
                type="number"
                step="0.1"
                placeholder="e.g., 68.5"
                value={formData.temperature}
                onChange={handleChange}
                className={errors.temperature ? "border-destructive" : ""}
              />
              {errors.temperature && (
                <p className="text-sm text-destructive mt-1">
                  {errors.temperature}
                </p>
              )}
            </div>

            {/* API Gravity */}
            <div>
              <Label htmlFor="api_gravity">
                API Gravity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="api_gravity"
                name="api_gravity"
                type="number"
                step="0.01"
                placeholder="e.g., 35.5"
                value={formData.api_gravity}
                onChange={handleChange}
                className={errors.api_gravity ? "border-destructive" : ""}
              />
              {errors.api_gravity && (
                <p className="text-sm text-destructive mt-1">
                  {errors.api_gravity}
                </p>
              )}
            </div>

            {/* Pressure (Optional) */}
            <div>
              <Label htmlFor="pressure">Pressure (PSI)</Label>
              <Input
                id="pressure"
                name="pressure"
                type="number"
                step="0.1"
                placeholder="Optional"
                value={formData.pressure}
                onChange={handleChange}
                className={errors.pressure ? "border-destructive" : ""}
              />
              {errors.pressure && (
                <p className="text-sm text-destructive mt-1">
                  {errors.pressure}
                </p>
              )}
            </div>

            {/* Meter Factor */}
            <div>
              <Label htmlFor="meter_factor">
                Meter Factor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="meter_factor"
                name="meter_factor"
                type="number"
                step="0.001"
                placeholder="e.g., 1.0"
                value={formData.meter_factor}
                onChange={handleChange}
                className={errors.meter_factor ? "border-destructive" : ""}
              />
              {errors.meter_factor && (
                <p className="text-sm text-destructive mt-1">
                  {errors.meter_factor}
                </p>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-lg bg-destructive/10 border border-destructive p-3">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Entry"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
