// components/SummaryCard.tsx
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  unit: string;
  valueColor?: string;
  bgColor?: string;
  extra?: string;
}

export const SummaryCard = ({
  icon: Icon,
  title,
  value,
  unit,
  valueColor,
  bgColor = "bg-primary/5",
  extra,
}: SummaryCardProps) => (
  <div className={`p-4 border rounded-lg ${bgColor}`}>
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
      <Icon className="h-4 w-4" />
      {title}
    </div>
    <div className={`text-2xl font-bold font-mono ${valueColor || ""}`}>
      {value} <span className="text-sm font-normal">{unit}</span>
    </div>
    {extra && (
      <div className="text-xs text-muted-foreground mt-1 font-mono">
        {extra}
      </div>
    )}
  </div>
);

// components/KeyValueRow.tsx
interface KeyValueRowProps {
  label: string;
  value: string;
  valueClassName?: string;
}

export const KeyValueRow = ({ label, value, valueClassName = "font-mono" }: KeyValueRowProps) => (
  <div className="flex justify-between p-3 bg-muted/50 rounded">
    <span className="text-muted-foreground">{label}:</span>
    <span className={valueClassName}>{value}</span>
  </div>
);

export const ALLOCATION_COLUMNS = [
  { key: "partner", label: "Partner", align: "left" as const },
  { key: "gross", label: "Gross Volume (mbbls)", align: "center" as const },
  { key: "bsw", label: "BSW %", align: "center" as const },
  { key: "ownership", label: "Ownership %", align: "center" as const },
  { key: "allocated", label: "Allocated Volume (mbbls)", align: "center" as const },
  { key: "shrinkage", label: "Shrinkage (mbbls)", align: "right" as const },
];