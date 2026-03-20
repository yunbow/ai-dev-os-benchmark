"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { CategorySchema, type CategoryInput } from "../schema/category-schema";
import { createCategoryAction, updateCategoryAction } from "../server/category-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const PRESET_COLORS = [
  "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#33FFF6",
  "#FFB833", "#8B33FF", "#FF8B33", "#33FF8B", "#FF3333",
];

interface CategoryFormProps {
  teamId?: string;
  editCategory?: { id: string; name: string; color: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({ teamId, editCategory, onSuccess, onCancel }: CategoryFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: editCategory?.name || "",
      color: editCategory?.color || "#3357FF",
      teamId: teamId || undefined,
    },
  });

  const selectedColor = form.watch("color");

  const onSubmit = async (data: CategoryInput) => {
    setIsLoading(true);
    try {
      const result = editCategory
        ? await updateCategoryAction({ ...data, id: editCategory.id })
        : await createCategoryAction(data);

      if (result.success) {
        toast({ title: editCategory ? "Category updated" : "Category created" });
        onSuccess?.();
        if (!editCategory) form.reset({ name: "", color: "#3357FF", teamId });
      } else {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl><Input placeholder="Category name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color *</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input type="color" className="h-9 w-16 cursor-pointer p-1" {...field} />
                </FormControl>
                <Input
                  placeholder="#FF5733"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="flex-1 font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: selectedColor === color ? "currentColor" : "transparent",
                    }}
                    onClick={() => field.onChange(color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <FormDescription>Must be a valid hex color code</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editCategory ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
