import { XCircle, CheckCircle } from "lucide-react";

interface AlertProps {
  message: string;
  variant: "destructive" | "success";
}

export const Alert: React.FC<AlertProps> = ({ message, variant }) => {
  if (variant === "destructive") {
    return (
      <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg flex items-center gap-2">
        <XCircle className="h-5 w-5 text-destructive" />
        <p className="text-sm text-destructive">{message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-success/50 bg-success/10 rounded-lg flex items-center gap-2">
      <CheckCircle className="h-5 w-5 text-success" />
      <p className="text-sm text-success">{message}</p>
    </div>
  );
};