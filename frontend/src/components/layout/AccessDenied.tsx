import React from "react";

interface AccessDeniedProps {
  title?: string;
  message: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = "Access Denied",
  message,
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};