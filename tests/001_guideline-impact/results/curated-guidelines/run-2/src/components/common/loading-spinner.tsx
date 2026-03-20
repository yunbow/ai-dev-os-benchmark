import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeMap[size],
        className
      )}
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <LoadingSpinner size="lg" className="text-primary" />
    </div>
  );
}
