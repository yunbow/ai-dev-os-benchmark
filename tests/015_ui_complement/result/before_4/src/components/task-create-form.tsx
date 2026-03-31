"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormData = {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  dueDate: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.title.trim()) {
    errors.title = "タイトルは必須です";
  } else if (data.title.length > 100) {
    errors.title = "タイトルは100文字以内で入力してください";
  }

  if (data.description.length > 500) {
    errors.description = "説明は500文字以内で入力してください";
  }

  return errors;
}

export default function TaskCreateForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    status: "todo",
    dueDate: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "タスクの作成に失敗しました");
      }

      setFormData({ title: "", description: "", status: "todo", dueDate: "" });
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "予期しないエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded p-4 space-y-4">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded">
          {submitError}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          className={`w-full border rounded px-3 py-2 text-sm ${
            errors.title ? "border-red-400" : "border-gray-300"
          }`}
          placeholder="タスクのタイトル"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className={`w-full border rounded px-3 py-2 text-sm ${
            errors.description ? "border-red-400" : "border-gray-300"
          }`}
          placeholder="タスクの詳細"
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            ステータス
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="todo">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="done">完了</option>
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
            期限
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "作成中..." : "タスクを作成"}
      </button>
    </form>
  );
}
