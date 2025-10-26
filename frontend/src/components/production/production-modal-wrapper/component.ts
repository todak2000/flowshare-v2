import { ProductionEntry } from "@/types/production";

export interface ProductionEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export interface FormData {
  measurement_date: string;
  gross_volume: string;
  bsw_percent: string;
  temperature: string;
  api_gravity: string;
  pressure: string;
  meter_factor: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
  submit?: string;
}
export type EditableField = {
  name: keyof ProductionEntry;
  label: string;
  required: boolean;
  step: string
  // ... any other properties your field objects have
};

export const DISPLAY_FIELDS = [
  { key: "measurement_date", label: "Measurement Date", format: (v: string) => new Date(v).toLocaleDateString() },
  { key: "gross_volume", label: "Gross Volume", format: (v: number) => `${v.toFixed(2)} bbls` },
  { key: "bsw_percent", label: "BSW %", format: (v: number) => `${v.toFixed(2)}%` },
  { key: "temperature", label: "Temperature", format: (v: number) => `${v.toFixed(2)}°F` },
  { key: "api_gravity", label: "API Gravity", format: (v: number) => v.toFixed(2) },
  { key: "meter_factor", label: "Meter Factor", format: (v: number) => v.toFixed(4) },
  { key: "pressure", label: "Pressure", format: (v: number) => `${v.toFixed(2)} psia`, condition: (e: ProductionEntry) => e.pressure != null },
];

export interface ApproveEntryModalProps {
  entry: ProductionEntry | null;
  open: boolean;
  onClose: () => void;
  onApprove: (entryId: string) => Promise<void>;
  onReject: (entryId: string) => Promise<void>;
}


export const EDITABLE_FIELDS: EditableField[] = [
  { name: "gross_volume", label: "Gross Volume (bbls)", required: true, step: "0.01" },
  { name: "bsw_percent", label: "BSW %", required: true, step: "0.01" },
  { name: "temperature", label: "Temperature (°F)", required: true, step: "0.01" },
  { name: "api_gravity", label: "API Gravity", required: true, step: "0.01" },
  { name: "pressure", label: "Pressure (psia)", required: false, step: "0.01" },
  { name: "meter_factor", label: "Meter Factor", required: false, step: "0.0001" },
];

export interface EditEntryModalProps {
  entry: ProductionEntry | null;
  open: boolean;
  onClose: () => void;
  onSave: (entryId: string, updates: any, editReason: string) => Promise<void>;
}



export const FIELDS = [
  { name: "gross_volume", label: "Gross Volume (BBL)", required: true, type: "number", step: "0.01", placeholder: "e.g., 1250.50" },
  { name: "bsw_percent", label: "BSW %", required: true, type: "number", step: "0.01", placeholder: "e.g., 2.5" },
  { name: "temperature", label: "Temperature (°F)", required: true, type: "number", step: "0.1", placeholder: "e.g., 68.5" },
  { name: "api_gravity", label: "API Gravity", required: true, type: "number", step: "0.01", placeholder: "e.g., 35.5" },
  { name: "pressure", label: "Pressure (PSI)", required: false, type: "number", step: "0.1", placeholder: "Optional" },
  { name: "meter_factor", label: "Meter Factor", required: true, type: "number", step: "0.001", placeholder: "e.g., 1.0" },
];

export const validateField = (name: string, value: string): string | undefined => {
    const num = (v: string) => parseFloat(v);
    switch (name) {
      case "measurement_date":
        if (!value) return "Measurement date is required";
        if (new Date(value) > new Date()) return "Date cannot be in the future";
        return;
      case "gross_volume":
        if (!value) return "Gross volume is required";
        const v = num(value);
        if (isNaN(v) || v <= 0) return "Must be a positive number";
        if (v > 1000000) return "Volume seems unusually high";
        return;
      case "bsw_percent":
        if (!value) return "BSW percentage is required";
        const b = num(value);
        if (isNaN(b) || b < 0 || b > 100) return "Must be between 0 and 100";
        return;
      case "temperature":
        if (!value) return "Temperature is required";
        const t = num(value);
        if (isNaN(t)) return "Must be a valid number";
        if (t < -50 || t > 300) return "Temperature out of normal range";
        return;
      case "api_gravity":
        if (!value) return "API gravity is required";
        const a = num(value);
        if (isNaN(a) || a < 0 || a > 100) return "Must be between 0 and 100";
        return;
      case "pressure":
        if (value && (isNaN(num(value)) || num(value) < 0)) return "Must be a positive number";
        return;
      case "meter_factor":
        if (!value) return "Meter factor is required";
        const m = num(value);
        if (isNaN(m) || m <= 0) return "Must be a positive number";
        if (m < 0.5 || m > 2.0) return "Meter factor typically between 0.5 and 2.0";
        return;
    }
  };