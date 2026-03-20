"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorMessage } from "@/components/common/error-message";
import { CategorySchema, type CategoryInput } from "../schema/category-schema";
import { createCategory, updateCategory } from "../server/category-actions";
import type { Category } from "@prisma/client";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#84cc16",
];

interface CategoryFormProps {
  category?: Category;
  onSuccess: (category: Category) => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues: category
      ? { name: category.name, color: category.color }
      : { color: "#3b82f6" },
  });

  const colorValue = watch("color");

  const onSubmit = async (data: CategoryInput) => {
    setServerError(null);
    try {
      const result = isEditing
        ? await updateCategory(category.id, data)
        : await createCategory(data);

      if (!result.success) {
        setServerError(result.error.message);
        return;
      }

      onSuccess(result.data);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ErrorMessage message={serverError} />

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="e.g. Work, Personal, Bug"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Color *</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue("color", c)}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                colorValue === c
                  ? "border-gray-900 scale-110"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-md border border-gray-300 shrink-0"
            style={{
              backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(colorValue)
                ? colorValue
                : "#6b7280",
            }}
          />
          <Input
            placeholder="#3b82f6"
            {...register("color")}
            aria-invalid={!!errors.color}
          />
        </div>
        {errors.color && (
          <p className="text-xs text-red-600">{errors.color.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Saving..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Create category"
          )}
        </Button>
      </div>
    </form>
  );
}
