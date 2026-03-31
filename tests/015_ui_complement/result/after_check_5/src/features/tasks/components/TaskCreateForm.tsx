"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, type CreateTaskInput } from "../schema/task.schema";
import { createTaskAction } from "../server/actions";

export function TaskCreateForm() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { status: "todo" },
  });

  const onSubmit = (data: CreateTaskInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", data.title);
      if (data.description) formData.set("description", data.description);
      formData.set("status", data.status);

      const result = await createTaskAction(formData);
      if (!result.success) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          setError(field as keyof CreateTaskInput, { message: messages[0] });
        });
        return;
      }
      reset();
    });
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.375rem",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  };

  const errorStyle: React.CSSProperties = {
    color: "#dc2626",
    fontSize: "0.8rem",
    marginTop: "0.25rem",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label htmlFor="title" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
          タイトル <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register("title")}
          style={{ ...fieldStyle, borderColor: errors.title ? "#dc2626" : "#d1d5db" }}
          placeholder="タスクのタイトルを入力"
          aria-describedby={errors.title ? "title-error" : undefined}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p id="title-error" role="alert" style={errorStyle}>
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
          説明
        </label>
        <textarea
          id="description"
          {...register("description")}
          style={{ ...fieldStyle, borderColor: errors.description ? "#dc2626" : "#d1d5db", resize: "vertical", minHeight: "5rem" }}
          placeholder="タスクの説明（任意）"
          aria-describedby={errors.description ? "description-error" : undefined}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p id="description-error" role="alert" style={errorStyle}>
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="status" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
          ステータス
        </label>
        <select
          id="status"
          {...register("status")}
          style={fieldStyle}
        >
          <option value="todo">未着手</option>
          <option value="in_progress">進行中</option>
          <option value="done">完了</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "0.625rem 1.25rem",
          background: isPending ? "#9ca3af" : "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "0.375rem",
          fontSize: "0.9rem",
          fontWeight: 500,
          cursor: isPending ? "not-allowed" : "pointer",
          alignSelf: "flex-start",
        }}
      >
        {isPending ? "作成中..." : "タスクを作成"}
      </button>
    </form>
  );
}
