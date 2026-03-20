"use client";

import React, { useState, useTransition } from "react";
import { createCategory, updateCategory } from "@/actions/category-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import { sanitizeHexColor } from "@/lib/utils";
import type { Category } from "@prisma/client";

interface CategoryFormProps {
  category?: Pick<Category, "id" | "name" | "color">;
  teamId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#64748b", // Slate
];

export function CategoryForm({
  category,
  teamId,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [selectedColor, setSelectedColor] = useState(
    category?.color || "#6366f1"
  );
  const [colorInput, setColorInput] = useState(category?.color || "#6366f1");
  const isEditing = !!category;

  const handleColorChange = (color: string) => {
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setSelectedColor(color);
      setColorInput(color);
    }
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setColorInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setSelectedColor(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const rawData = {
      name: formData.get("name") as string,
      color: sanitizeHexColor(selectedColor), // Sanitize before sending
      teamId: teamId || null,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateCategory(category.id, rawData)
        : await createCategory(rawData);

      if (result.success) {
        toast({
          variant: "success",
          title: isEditing ? "Category updated" : "Category created",
          description: result.message,
        });
        onSuccess?.();
      } else {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="category-name">
          Name <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="category-name"
          name="name"
          type="text"
          required
          maxLength={50}
          defaultValue={category?.name}
          placeholder="Category name"
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          aria-invalid={!!fieldErrors.name}
          aria-required="true"
        />
        {fieldErrors.name && (
          <p id="name-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.name[0]}
          </p>
        )}
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label>Color</Label>

        {/* Preset colors */}
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color presets">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selectedColor === color}
              aria-label={`Color ${color}`}
              className={`h-7 w-7 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                selectedColor === color
                  ? "ring-2 ring-offset-2 scale-110"
                  : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>

        {/* Custom color input */}
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded border"
            style={{ backgroundColor: sanitizeHexColor(selectedColor) }}
            aria-hidden="true"
          />
          <Input
            type="text"
            value={colorInput}
            onChange={handleColorInputChange}
            placeholder="#RRGGBB"
            className="w-32 font-mono text-sm"
            pattern="^#[0-9A-Fa-f]{6}$"
            aria-label="Custom hex color"
            aria-describedby={fieldErrors.color ? "color-error" : "color-hint"}
          />
          <p id="color-hint" className="text-xs text-muted-foreground">
            6-digit hex (e.g., #FF5733)
          </p>
        </div>

        {fieldErrors.color && (
          <p id="color-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.color[0]}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? (
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
