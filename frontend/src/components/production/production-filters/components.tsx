import { Input } from "@/components/ui/input";
import { ProductionEntryStatus, ProductionFilters } from "@/types/production";

export interface ProductionFiltersProps {
  filters: ProductionFilters;
  onFiltersChange: (filters: ProductionFilters) => void;
  showPartnerFilter?: boolean;
  partners?: Array<{ id: string; name: string; organization?: string }>;
}

export const FILTER_FIELDS = [
  {
    key: "partner_id",
    label: "Partner",
    type: "select",
    condition: (props: ProductionFiltersProps) =>
      (props.showPartnerFilter && props?.partners?.length) || 0 > 0,
    options: (props: ProductionFiltersProps) =>
      props?.partners?.map((p) => ({
        value: p.id,
        label: p.organization || p.name,
      })),
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "", label: "All Statuses" },
      { value: ProductionEntryStatus.PENDING, label: "Pending" },
      { value: ProductionEntryStatus.APPROVED, label: "Approved" },
      { value: ProductionEntryStatus.FLAGGED, label: "Flagged" },
      { value: ProductionEntryStatus.REJECTED, label: "Rejected" },
    ],
  },
  {
    key: "start_date",
    label: "Start Date",
    type: "date",
  },
  {
    key: "end_date",
    label: "End Date",
    type: "date",
  },
  {
    key: "min_temperature",
    label: "Min Temperature (°F)",
    type: "number",
    placeholder: "e.g., 50",
  },
  {
    key: "max_temperature",
    label: "Max Temperature (°F)",
    type: "number",
    placeholder: "e.g., 120",
  },
  {
    key: "min_bsw",
    label: "Min BSW (%)",
    type: "number",
    placeholder: "e.g., 0",
    min: "0",
    max: "100",
    step: "0.1",
  },
  {
    key: "max_bsw",
    label: "Max BSW (%)",
    type: "number",
    placeholder: "e.g., 100",
    min: "0",
    max: "100",
    step: "0.1",
  },
] as const;

export const FilterField = ({
  field,
  value,
  onChange,
  partners,
  showPartnerFilter,
}: {
  field: any;
  value: any;
  onChange: (key: keyof ProductionFilters, value: any) => void;

  partners: ProductionFiltersProps["partners"];
  showPartnerFilter: boolean;
}) => {
  const props = { partners, showPartnerFilter };

  // Conditional rendering
  if (field.condition && !field.condition(props)) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // This is the raw value from the input, which is ALWAYS a string
    const strVal = e.target.value;

    // This variable will hold the correctly-typed final value
    let finalValue: string | number | undefined;

    if (field.type === "number") {
      // Process the string value into a number or undefined
      finalValue = strVal === "" ? undefined : parseFloat(strVal);
    } else {
      // Just use the string value directly
      finalValue = strVal;
    }

    // Send the final, correctly-typed value
    onChange(field.key, finalValue);
  };

  switch (field.type) {
    case "select":
      const options = Array.isArray(field.options)
        ? field.options
        : field.options({ partners, showPartnerFilter });
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {field.label}
          </label>
          <select
            value={value || ""}
            onChange={handleChange as any}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {options.map((opt: Record<string, any>) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case "date":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {field.label}
          </label>
          <Input
            type="date"
            value={value || ""}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {field.label}
          </label>
          <Input
            type="number"
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            value={value || ""}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      );

    default:
      return null;
  }
};

export const DATE_PRESETS = [
  { key: "current_month", label: "Current Month", icon: true },
  { key: "last_3_months", label: "Last 3 Months" },
  { key: "last_6_months", label: "Last 6 Months" },
  { key: "last_year", label: "Last Year" },
] as const;

export const applyDatePreset = (
  preset: string,
  onFiltersChange: (filters: ProductionFilters) => void,
  setActivePreset: (preset: string | null) => void,
  formatLocalDate: (date: Date) => string
) => {
  const now = new Date();
  let startDate: Date;

  switch (preset) {
    case "last_6_months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case "last_year":
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    case "last_3_months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case "current_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      return;
  }

  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  onFiltersChange({
    start_date: formatLocalDate(startDate),
    end_date: formatLocalDate(endDate),
  });
  setActivePreset(preset);
};
