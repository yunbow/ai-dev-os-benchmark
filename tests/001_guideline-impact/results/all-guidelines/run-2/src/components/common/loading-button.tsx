import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({ children, loading = false, loadingText, disabled, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} aria-busy={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
