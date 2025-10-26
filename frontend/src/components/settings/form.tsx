import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Thermometer, Gauge } from "lucide-react";
import { TenantSettings } from "@/hooks/useTenantSettings"; // Import shared type

interface SettingsFormProps {
  formData: TenantSettings;
  onFormChange: (
    field: keyof TenantSettings,
    value: string | number
  ) => void;
}

const allocationModels = [
  { value: "api_mpms_11_1", label: "API MPMS 11.1", description: "Industry standard" },
  { value: "model_b", label: "Model B", description: "Alternative method" },
];

export const SettingsForm: React.FC<SettingsFormProps> = ({
  formData,
  onFormChange,
}) => (
  <>
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Allocation Model</CardTitle>
        </div>
        <CardDescription>
          Configure calculation method for allocations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Label htmlFor="allocation_model">Allocation Model *</Label>
        <Select
          value={formData.allocation_model}
          onValueChange={(value) => onFormChange("allocation_model", value)}
        >
          <SelectTrigger id="allocation_model">
            <SelectValue placeholder="Select allocation model" />
          </SelectTrigger>
          <SelectContent>
            {allocationModels.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                <span className="font-medium">{model.label}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {model.description}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Thermometer className="h-5 w-5 text-primary" />
          <CardTitle>Default Standards</CardTitle>
        </div>
        <CardDescription>
          Set default temperature and pressure standards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="temperature">Default Temperature Standard (°F) *</Label>
          <div className="relative">
            <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="temperature"
              type="number"
              step="0.1"
              className="pl-10"
              value={formData.default_temperature_standard}
              onChange={(e) =>
                onFormChange("default_temperature_standard", parseFloat(e.target.value))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pressure">Default Pressure Standard (psia) *</Label>
          <div className="relative">
            <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="pressure"
              type="number"
              step="0.001"
              className="pl-10"
              value={formData.default_pressure_standard}
              onChange={(e) =>
                onFormChange("default_pressure_standard", parseFloat(e.target.value))
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  </>
);