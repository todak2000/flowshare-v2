"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit3 } from "lucide-react";

import { ProductionEntry } from "@/types/production";
import {
  EDITABLE_FIELDS,
  EditEntryModalProps,
} from "./production-modal-wrapper/component";
import { ProductionModalWrapper } from "./production-modal-wrapper";

export function EditEntryModal({
  entry,
  open,
  onClose,
  onSave,
}: EditEntryModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (entry) {
      const initial: Record<string, string> = {};

      // No need to type 'field' here, it's inferred from the array
      EDITABLE_FIELDS.forEach((field) => {
        // This just works! 'field.name' is now strongly typed.
        initial[field.name] =
          entry[field.name]?.toString() ||
          (field.name === "meter_factor" ? "1.0" : "");
      });

      setFormData(initial);
      setEditReason("");
      setError("");
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReason.trim()) {
      setError("Please provide a reason for this edit");
      return;
    }

    const updates: any = {};
    EDITABLE_FIELDS.forEach((field) => {
      const currentValue = formData[field.name];
      const originalValue = entry?.[field.name as keyof ProductionEntry];
      if (currentValue && parseFloat(currentValue) !== originalValue) {
        updates[field.name] = parseFloat(currentValue);
      }
    });

    if (Object.keys(updates).length === 0) {
      setError("No changes detected");
      return;
    }

    try {
      setSaving(true);
      await onSave(entry!.id, updates, editReason);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update entry");
    } finally {
      setSaving(false);
    }
  };

  if (!entry) return null;

  return (
    <ProductionModalWrapper
      open={open}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Edit Production Entry
        </span>
      }
      description={`Update production data for ${new Date(
        entry.measurement_date
      ).toLocaleDateString()}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
          <Label htmlFor="editReason" className="text-sm font-semibold">
            Reason for Edit <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="editReason"
            placeholder="Explain why you're editing this entry..."
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            rows={3}
            required
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This will be sent to the partner for approval
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EDITABLE_FIELDS.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}{" "}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id={field.name}
                type="number"
                step={field.step}
                value={formData[field.name] || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    [field.name]: e.target.value,
                  }))
                }
                required={field.required}
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          After saving, this entry will be marked as "Pending Approval" until
          the partner reviews and approves the changes.
        </p>
      </form>
    </ProductionModalWrapper>
  );
}
