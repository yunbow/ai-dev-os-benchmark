"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import { CreateCategorySchema, CreateCategoryInput } from "../schema/category-schema";
import { createCategory, updateCategory } from "../server/category-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
}

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!category;

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      color: category?.color ?? "#6366f1",
    },
  });

  const onSubmit = async (data: CreateCategoryInput) => {
    setIsLoading(true);

    if (isEditing && category) {
      const result = await updateCategory(category.id, data);
      if (!result.success) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      toast({ title: "Success", description: "Category updated" });
    } else {
      const result = await createCategory(data);
      if (!result.success) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      toast({ title: "Success", description: "Category created" });
    }

    router.refresh();
    onSuccess?.();
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...field}
                    className="h-10 w-12 cursor-pointer rounded border border-input"
                  />
                  <Input
                    placeholder="#6366f1"
                    {...field}
                    className="flex-1"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          {isEditing ? "Update Category" : "Create Category"}
        </Button>
      </form>
    </Form>
  );
}
