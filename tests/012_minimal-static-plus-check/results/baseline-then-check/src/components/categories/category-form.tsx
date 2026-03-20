"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import { toast } from "@/hooks/use-toast";
import { createCategorySchema } from "@/lib/validations";

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    color: string;
    teamId?: string | null;
  };
  teamId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({
  category,
  teamId,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || "#6366F1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const input = { name, color, teamId: teamId || null };
    const parsed = createCategorySchema.safeParse(input);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      let result;
      if (category) {
        result = await updateCategory({ id: category.id, name, color });
      } else {
        result = await createCategory({ name, color, teamId: teamId || null });
      }

      if (result.success) {
        toast({
          title: category ? "Category updated" : "Category created",
          variant: "default",
        });
        onSuccess?.();
      } else {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="cat-name">
          Name <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          maxLength={50}
          aria-required="true"
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? "cat-name-error" : undefined}
        />
        {fieldErrors.name && (
          <p id="cat-name-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="cat-color">
          Color <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            id="cat-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 p-1 cursor-pointer"
            aria-label="Select category color"
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#RRGGBB"
            className="font-mono"
            maxLength={7}
            aria-label="Color hex value"
            aria-invalid={!!fieldErrors.color}
            aria-describedby={fieldErrors.color ? "cat-color-error" : undefined}
          />
        </div>
        {fieldErrors.color && (
          <p id="cat-color-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.color[0]}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : category ? "Update" : "Create"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
