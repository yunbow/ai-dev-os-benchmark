"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory } from "@/actions/category";
import { useToast } from "@/hooks/use-toast";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { isHexColor } from "@/lib/utils";
import { useState } from "react";

interface CategoryFormProps {
  teamId?: string;
  onSuccess?: () => void;
}

export function CategoryForm({ teamId, onSuccess }: CategoryFormProps) {
  const [colorPreview, setColorPreview] = useState("#6b7280");
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
  });

  const colorValue = watch("color");

  async function handleCategoryCreate(data: CategoryInput) {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("color", data.color);
    if (teamId) formData.set("teamId", teamId);

    const result = await createCategory(formData);

    if (result.success) {
      toast({ title: "Category created" });
      reset();
      setColorPreview("#6b7280");
      onSuccess?.();
    } else {
      toast({ variant: "destructive", title: "Failed to create category", description: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleCategoryCreate)} className="space-y-4" noValidate>
      <div className="space-y-1">
        <Label htmlFor="cat-name">Name <span aria-hidden="true">*</span></Label>
        <Input
          id="cat-name"
          maxLength={50}
          aria-required="true"
          aria-describedby={errors.name ? "cat-name-error" : undefined}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <p id="cat-name-error" className="text-xs text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="cat-color">Color <span aria-hidden="true">*</span></Label>
        <div className="flex gap-2 items-center">
          <Input
            id="cat-color"
            placeholder="#FF5733"
            maxLength={7}
            aria-required="true"
            aria-describedby={errors.color ? "cat-color-error" : "cat-color-hint"}
            aria-invalid={!!errors.color}
            {...register("color", {
              onChange: (e) => {
                const val = e.target.value;
                if (isHexColor(val)) setColorPreview(val);
              },
            })}
          />
          <span
            className="h-8 w-8 rounded-full border shrink-0"
            style={{ backgroundColor: isHexColor(colorValue) ? colorValue : colorPreview }}
            aria-label={`Color preview: ${colorValue || colorPreview}`}
          />
        </div>
        <p id="cat-color-hint" className="text-xs text-muted-foreground">
          Enter a hex color code, e.g., #FF5733
        </p>
        {errors.color && (
          <p id="cat-color-error" className="text-xs text-destructive" role="alert">
            {errors.color.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Category"}
      </Button>
    </form>
  );
}
