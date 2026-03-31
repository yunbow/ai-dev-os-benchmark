"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormErrors = {
  title?: string;
};

export default function TaskForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const title = (data.get("title") as string).trim();
    const description = (data.get("description") as string).trim();
    const status = data.get("status") as string;
    const dueDate = (data.get("dueDate") as string).trim();

    // Validation
    const newErrors: FormErrors = {};
    if (!title) newErrors.title = "タイトルは必須です";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setServerError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          status,
          dueDate: dueDate || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setServerError(body.error ?? "作成に失敗しました");
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setServerError("ネットワークエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <h2>タスク作成</h2>

      {serverError && (
        <p style={{ color: "red" }}>{serverError}</p>
      )}

      <div>
        <label htmlFor="title">タイトル *</label>
        <br />
        <input id="title" name="title" type="text" />
        {errors.title && (
          <p style={{ color: "red", margin: "2px 0" }}>{errors.title}</p>
        )}
      </div>

      <div style={{ marginTop: "0.5rem" }}>
        <label htmlFor="description">説明</label>
        <br />
        <textarea id="description" name="description" rows={3} />
      </div>

      <div style={{ marginTop: "0.5rem" }}>
        <label htmlFor="status">ステータス</label>
        <br />
        <select id="status" name="status" defaultValue="todo">
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div style={{ marginTop: "0.5rem" }}>
        <label htmlFor="dueDate">期限日</label>
        <br />
        <input id="dueDate" name="dueDate" type="date" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{ marginTop: "1rem" }}
      >
        {submitting ? "作成中..." : "作成"}
      </button>
    </form>
  );
}
