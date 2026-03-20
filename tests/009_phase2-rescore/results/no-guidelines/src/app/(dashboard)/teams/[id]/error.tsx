"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TeamError() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <Button variant="outline" asChild>
        <Link href="/teams">Back to teams</Link>
      </Button>
    </div>
  );
}
