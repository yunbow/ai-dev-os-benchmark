"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategorySchema, type CreateCategoryInput } from "@/lib/validations/category";
import { createCategoryAction, updateCategoryAction } from "@/actions/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { CategoryWithCount } from "@/types";

interface CategoryFormProps {
  category?: CategoryWithCount;
  teamId?: string;
  onSuccess?: (category: CategoryWithCount) => void;
  onCancel?: () => void;
}

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#6366F1", "#A855F7", "#EC4899",
  "#6B7280", "#0EA5E9",
];

export function CategoryForm({ category, teamId, onSuccess, onCancel }: CategoryFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      color: category?.color ?? "#6366F1",
      teamId: teamId ?? category?.teamId ?? undefined,
    },
  });

  const watchColor = watch("color");

  const onSubmit = async (data: CreateCategoryInput) => {
    setIsLoading(true);
    try {
      if (isEditing && category) {
        const result = await updateCategoryAction(category.id, data);
        if (result.success) {
          toast({ title: "Category updated" });
          onSuccess?.(result.data);
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      } else {
        const result = await createCategoryAction(data);
        if (result.success) {
          toast({ title: "Category created" });
          onSuccess?.(result.data);
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Category name"
          aria-describedby={errors.name ? "name-error" : undefined}
          aria-required="true"
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-red-600" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-3">
          <Input
            id="color"
            type="color"
            className="h-10 w-20 cursor-pointer p-1"
            aria-describedby={errors.color ? "color-error" : undefined}
            {...register("color")}
          />
          <Input
            type="text"
            value={watchColor}
            onChange={(e) => setValue("color", e.target.value)}
            placeholder="#6366F1"
            className="w-32 font-mono text-sm"
            aria-label="Hex color code"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1"
              style={{
                backgroundColor: color,
                borderColor: watchColor === color ? color : "transparent",
                boxShadow: watchColor === color ? `0 0 0 2px ${color}40` : "none",
              }}
              onClick={() => setValue("color", color)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
        {errors.color && (
          <p id="color-error" className="text-sm text-red-600" role="alert">
            {errors.color.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
