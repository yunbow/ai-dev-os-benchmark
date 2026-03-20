"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TaskCard } from "@/features/tasks/components/task-card";
import { TaskForm } from "@/features/tasks/components/task-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getTasksAction } from "@/features/tasks/server/task-actions";
import { getCategoriesAction } from "@/features/categories/server/category-actions";
import { Plus, Search, CheckSquare } from "lucide-react";
import type { Task, Category, User } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

type TaskWithRelations = Task & {
  category: { id: string; name: string; color: string } | null;
  assignee: Pick<User, "id" | "name" | "email" | "image"> | null;
  creator: Pick<User, "id" | "name" | "email"> | null;
};

type CategoryItem = { id: string; name: string; color: string };

export default function TasksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithRelations | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "ALL");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") ?? "ALL");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchTasks = useCallback(async (reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const result = await getTasksAction({
      search: search || undefined,
      status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
      priority: priorityFilter !== "ALL" ? (priorityFilter as any) : undefined,
      cursor: reset ? undefined : nextCursor ?? undefined,
      limit: 20,
    });

    if (result.success) {
      if (reset) {
        setTasks(result.data.tasks as TaskWithRelations[]);
      } else {
        setTasks((prev) => [...prev, ...result.data.tasks as TaskWithRelations[]]);
      }
      setNextCursor(result.data.nextCursor ?? null);
      setHasMore(result.data.hasMore);
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }

    if (reset) setLoading(false);
    else setLoadingMore(false);
  }, [search, statusFilter, priorityFilter, nextCursor, toast]);

  useEffect(() => {
    getCategoriesAction().then((r) => {
      if (r.success) setCategories(r.data);
    });
  }, []);

  useEffect(() => {
    fetchTasks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, priorityFilter]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("search", value);
    else params.delete("search");
    router.replace(`/tasks?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priority</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="No tasks found"
          description={search ? "Try adjusting your search or filters." : "Create your first task to get started."}
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => setEditTask(task)}
                onDeleted={() => fetchTasks(true)}
                onUpdated={() => fetchTasks(true)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => fetchTasks(false)} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            categories={categories}
            onSuccess={() => {
              setShowCreateDialog(false);
              fetchTasks(true);
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTask} onOpenChange={(open) => !open && setEditTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editTask && (
            <TaskForm
              editTask={editTask}
              categories={categories}
              onSuccess={() => {
                setEditTask(null);
                fetchTasks(true);
              }}
              onCancel={() => setEditTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
