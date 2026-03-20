import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message?: string | null;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
