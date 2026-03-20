"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { createCategoryAction } from "@/actions/categories";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface CreateCategoryDialogProps {
  teamId?: string;
}

export function CreateCategoryDialog({ teamId }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (teamId) formData.set("teamId", teamId);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createCategoryAction(formData);
      if (!result.success) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Category created" });
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          New Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name *</Label>
            <Input id="cat-name" name="name" required maxLength={50} />
            {fieldErrors.name?.[0] && <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-color">Color *</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="cat-color"
                name="color"
                type="color"
                defaultValue="#3B82F6"
                className="h-10 w-16 p-1 cursor-pointer"
              />
              <Input
                placeholder="#3B82F6"
                className="flex-1"
                onChange={(e) => {
                  const colorInput = document.getElementById("cat-color") as HTMLInputElement;
                  if (colorInput && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    colorInput.value = e.target.value;
                  }
                }}
              />
            </div>
            {fieldErrors.color?.[0] && <p className="text-xs text-destructive">{fieldErrors.color[0]}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
