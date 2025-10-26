import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReactNode } from "react";

interface AuthInputProps extends InputProps {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

export function AuthInput({
  id,
  label,
  icon,
  description,
  className = "",
  ...props
}: AuthInputProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative my-2">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            {icon}
          </div>
        )}
        <Input
          id={id}
          className={icon ? "pl-10" : ""}
          {...props}
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}