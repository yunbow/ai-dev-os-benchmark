"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { listTasks } from "@/features/task/server/task-actions";
import type { TaskWithRelations } from "@/features/task/services/task-service";
import type { TaskFiltersInput } from "@/features/task/schema/task-schema";

interface UseTaskListState {
  tasks: TaskWithRelations[];
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
}

interface UseTaskListReturn extends UseTaskListState {
  refresh: () => void;
  fetchMore: () => void;
  optimisticUpdate: (taskId: string, updater: (task: TaskWithRelations) => TaskWithRelations) => void;
  optimisticRemove: (taskId: string) => void;
  optimisticAdd: (task: TaskWithRelations) => void;
}

export function useTaskList(filters: Omit<TaskFiltersInput, "cursor">): UseTaskListReturn {
  const [state, setState] = useState<UseTaskListState>({
    tasks: [],
    nextCursor: null,
    hasMore: false,
    isLoading: true,
    isFetchingMore: false,
    error: null,
  });

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const load = useCallback(async (cursor?: string) => {
    const isInitial = !cursor;

    setState((prev) => ({
      ...prev,
      isLoading: isInitial,
      isFetchingMore: !isInitial,
      error: null,
    }));

    const result = await listTasks({ ...filtersRef.current, cursor });

    if (result.success) {
      setState((prev) => ({
        tasks: isInitial ? result.data.tasks : [...prev.tasks, ...result.data.tasks],
        nextCursor: result.data.nextCursor,
        hasMore: result.data.hasMore,
        isLoading: false,
        isFetchingMore: false,
        error: null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isFetchingMore: false,
        error: result.error.message,
      }));
    }
  }, []);

  // Reload when filters change
  useEffect(() => {
    load(undefined);
  }, [
    load,
    filters.status,
    filters.priority,
    filters.categoryId,
    filters.assigneeId,
    filters.teamId,
    filters.search,
    filters.sortBy,
    filters.sortOrder,
  ]);

  const refresh = useCallback(() => {
    load(undefined);
  }, [load]);

  const fetchMore = useCallback(() => {
    if (state.nextCursor && !state.isFetchingMore) {
      load(state.nextCursor);
    }
  }, [load, state.nextCursor, state.isFetchingMore]);

  const optimisticUpdate = useCallback(
    (taskId: string, updater: (task: TaskWithRelations) => TaskWithRelations) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? updater(t) : t)),
      }));
    },
    []
  );

  const optimisticRemove = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  }, []);

  const optimisticAdd = useCallback((task: TaskWithRelations) => {
    setState((prev) => ({
      ...prev,
      tasks: [task, ...prev.tasks],
    }));
  }, []);

  return {
    ...state,
    refresh,
    fetchMore,
    optimisticUpdate,
    optimisticRemove,
    optimisticAdd,
  };
}
