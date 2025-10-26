// components/modals/ProductionEntryModal.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { ProductionEntryCreate } from "@/types/production";
import { ProductionModalWrapper } from "./production-modal-wrapper";
import {
  FIELDS,
  FormData,
  FormErrors,
  ProductionEntryModalProps,
  validateField,
} from "./production-modal-wrapper/component";
import { formatDateToISO } from "@/lib/utils";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error, submit: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    for (const field of FIELDS) {
      const err = validateField(
        field.name,
        formData[field.name as keyof FormData]
      );
      if (err) newErrors[field.name] = err;
    }
    if (!user?.partner_id && userRole !== "coordinator") {
      newErrors.submit = "Partner ID is missing. Please contact support.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const extractErrorMessage = (error: any): string => {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail
        .map((err: any) => `${err.loc?.[1] || "Field"}: ${err.msg}`)
        .join("; ");
    }
    return typeof detail === "string"
      ? detail
      : "Failed to create entry. Please check your input and try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const tenantId = getTenantId();
    if (!tenantId || !user?.id) {
      setErrors({
        submit: "User or tenant info missing. Please log in again.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload: ProductionEntryCreate = {
        tenant_id: tenantId,
        partner_id: user.partner_id || user.id,
        measurement_date: formatDateToISO(formData.measurement_date),
        gross_volume: parseFloat(formData.gross_volume),
        bsw_percent: parseFloat(formData.bsw_percent),
        temperature: parseFloat(formData.temperature),
        api_gravity: parseFloat(formData.api_gravity),
        pressure: formData.pressure ? parseFloat(formData.pressure) : undefined,
        meter_factor: parseFloat(formData.meter_factor),
      };

      await apiClient.post("/api/production/entries", payload);

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
      setErrors({ submit: extractErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductionModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      title="New Production Entry"
      description="Enter production data for oil measurement. All fields marked with * are required."
    >
      <div className="rounded-lg bg-muted p-3 mb-4">
        <p className="text-sm text-muted-foreground">
          <strong>Date:</strong>{" "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Production entries are automatically recorded for today's date
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name}>
                {field.label}{" "}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type={field.type}
                step={field.step}
                placeholder={field.placeholder}
                value={formData[field.name as keyof FormData]}
                onChange={handleChange}
                className={errors[field.name] ? "border-destructive" : ""}
                required={field.required}
              />
              {errors[field.name] && (
                <p className="text-sm text-destructive mt-1">
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}
        </div>

        {errors.submit && (
          <div className="rounded-lg bg-destructive/10 border border-destructive p-3">
            <p className="text-sm text-destructive">{errors.submit}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
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
        </div>
      </form>
    </ProductionModalWrapper>
  );
}
