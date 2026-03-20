"use client";

import { useState, useCallback } from "react";
import { ActionResult } from "@/lib/actions/action-helpers";
import { toast } from "@/components/ui/use-toast";

interface UseAsyncActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (message: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useAsyncAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>,
  options: UseAsyncActionOptions<TOutput> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (input: TInput): Promise<ActionResult<TOutput>> => {
      setIsLoading(true);
      setError(null);

      const result = await action(input);

      if (result.success) {
        if (options.successMessage) {
          toast({ title: "Success", description: options.successMessage });
        }
        options.onSuccess?.(result.data);
      } else {
        const errorMsg = result.error.message ?? options.errorMessage ?? "An error occurred";
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
        options.onError?.(errorMsg);
      }

      setIsLoading(false);
      return result;
    },
    [action, options]
  );

  return { execute, isLoading, error };
}
