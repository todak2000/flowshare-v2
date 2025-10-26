import { Button, ButtonProps } from "@/components/ui/button";
import { ReactNode } from "react";

interface AuthSubmitButtonProps extends ButtonProps {
  loading?: boolean;
  children: ReactNode;
  loadingText?: string;
}

export function AuthSubmitButton({
  loading = false,
  children,
  loadingText = "Processing...",
  className = "",
  ...props
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      className={`w-full ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? loadingText : children}
    </Button>
  );
}