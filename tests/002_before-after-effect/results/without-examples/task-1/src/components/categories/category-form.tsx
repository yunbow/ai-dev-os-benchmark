"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createCategorySchema, type CreateCategoryInput, isValidHexColor } from "@/lib/validations/category";
import { createCategory } from "@/lib/actions/categories";

export function CategoryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      color: "#3B82F6",
    },
  });

  const colorValue = watch("color");
  const isColorValid = isValidHexColor(colorValue ?? "");

  const onSubmit = async (data: CreateCategoryInput) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("color", data.color);

      const result = await createCategory(formData);

      if (result.success) {
        toast({ title: "Category created" });
        reset({ color: "#3B82F6" });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error.message,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="Category name"
          maxLength={50}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color *</Label>
        <div className="flex gap-2 items-center">
          <div
            className="w-8 h-8 rounded border flex-shrink-0"
            style={{ backgroundColor: isColorValid ? colorValue : "#ccc" }}
          />
          <Input
            id="color"
            placeholder="#RRGGBB"
            maxLength={7}
            {...register("color")}
          />
          <input
            type="color"
            value={isColorValid ? colorValue : "#3B82F6"}
            onChange={(e) => {
              const input = document.getElementById("color") as HTMLInputElement;
              if (input) input.value = e.target.value;
            }}
            className="w-8 h-8 p-0 border rounded cursor-pointer"
          />
        </div>
        {errors.color && (
          <p className="text-sm text-red-600">{errors.color.message}</p>
        )}
        <p className="text-xs text-gray-500">Enter a valid hex color (e.g., #3B82F6)</p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Category"}
      </Button>
    </form>
  );
}
