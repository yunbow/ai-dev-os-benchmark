"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { CreateTaskSchema, type CreateTaskInput } from "../schema/task-schema";
import { createTaskAction, updateTaskAction } from "../server/task-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Category { id: string; name: string; color: string }
interface User { id: string; name: string | null; email: string }

interface TaskFormProps {
  categories?: Category[];
  teamMembers?: User[];
  teamId?: string;
  editTask?: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    categoryId: string | null;
    assigneeId: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ categories = [], teamMembers = [], teamId, editTask, onSuccess, onCancel }: TaskFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: {
      title: editTask?.title || "",
      description: editTask?.description || "",
      status: editTask?.status || "TODO",
      priority: editTask?.priority || "MEDIUM",
      dueDate: editTask?.dueDate ? new Date(editTask.dueDate).toISOString() : undefined,
      categoryId: editTask?.categoryId || undefined,
      assigneeId: editTask?.assigneeId || undefined,
      teamId: teamId || undefined,
    },
  });

  const onSubmit = async (data: CreateTaskInput) => {
    setIsLoading(true);
    try {
      const result = editTask
        ? await updateTaskAction({ ...data, id: editTask.id })
        : await createTaskAction(data);

      if (result.success) {
        toast({ title: editTask ? "Task updated" : "Task created" });
        onSuccess?.();
        if (!editTask) form.reset();
      } else {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
        if (result.error.fieldErrors) {
          Object.entries(result.error.fieldErrors).forEach(([field, messages]) => {
            form.setError(field as keyof CreateTaskInput, { type: "server", message: messages[0] });
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl><Input placeholder="Task title" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Optional description" rows={3} {...field} value={field.value || ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {categories.length > 0 && (
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {teamMembers.length > 0 && (
          <FormField
            control={form.control}
            name="assigneeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignee</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Assign to..." /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editTask ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
