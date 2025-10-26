"use client";

import { Label } from "@/components/ui/label";

// --- Subcomponents ---
export const StatusBanner = ({
  variant,
  icon: Icon,
  title,
  children,
}: {
  variant: "success" | "error";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) => {
  const baseClasses = "rounded-lg p-4 flex items-start gap-3";
  const variantClasses =
    variant === "success"
      ? "bg-green-500/10 border border-green-500/20"
      : "bg-destructive/10 border border-destructive";
  const iconColor = variant === "success" ? "text-green-600" : "text-destructive";
  const textColor = variant === "success" ? "text-green-700 dark:text-green-400" : "text-destructive/90";

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <Icon className={`h-5 w-5 ${iconColor} mt-0.5`} />
      <div className="flex-1">
        <h4 className={`text-sm font-semibold ${textColor} mb-1`}>{title}</h4>
        <p className={`text-sm ${textColor}`}>{children}</p>
      </div>
    </div>
  );
};

export const FormField = ({
  label,
  htmlFor,
  required = false,
  children,
  info,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
  info?: string;
}) => (
  <div className="space-y-2">
    <Label htmlFor={htmlFor} className="flex items-center gap-2">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {info && <p className="text-xs text-muted-foreground">{info}</p>}
  </div>
);