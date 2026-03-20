"use client";

import { useState, useCallback } from "react";
import type { ActionResult } from "@/lib/actions/action-helpers";

interface UseAsyncActionState<T> {
  data: T | null;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  isLoading: boolean;
}

interface UseAsyncActionReturn<T, TInput> {
  execute: (input: TInput) => Promise<ActionResult<T>>;
  data: T | null;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  isLoading: boolean;
  reset: () => void;
}

export function useAsyncAction<T, TInput = unknown>(
  action: (input: TInput) => Promise<ActionResult<T>>
): UseAsyncActionReturn<T, TInput> {
  const [state, setState] = useState<UseAsyncActionState<T>>({
    data: null,
    error: null,
    fieldErrors: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (input: TInput): Promise<ActionResult<T>> => {
      setState({ data: null, error: null, fieldErrors: null, isLoading: true });

      try {
        const result = await action(input);

        if (result.success) {
          setState({
            data: result.data,
            error: null,
            fieldErrors: null,
            isLoading: false,
          });
        } else {
          setState({
            data: null,
            error: result.error.message,
            fieldErrors: result.error.fieldErrors ?? null,
            isLoading: false,
          });
        }

        return result;
      } catch {
        const errorResult: ActionResult<T> = {
          success: false,
          error: {
            code: "UNKNOWN_ERROR",
            message: "An unexpected error occurred",
          },
        };
        setState({
          data: null,
          error: "An unexpected error occurred",
          fieldErrors: null,
          isLoading: false,
        });
        return errorResult;
      }
    },
    [action]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, fieldErrors: null, isLoading: false });
  }, []);

  return { execute, ...state, reset };
}
