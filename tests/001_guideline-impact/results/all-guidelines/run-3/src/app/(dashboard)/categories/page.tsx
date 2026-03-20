import { Metadata } from "next";
import CategoriesClient from "@/features/categories/components/CategoriesClient";

export const metadata: Metadata = {
  title: "Categories - TaskFlow",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
      <CategoriesClient />
    </div>
  );
}
