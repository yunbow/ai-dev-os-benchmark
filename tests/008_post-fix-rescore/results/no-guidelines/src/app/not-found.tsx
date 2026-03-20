import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <FileQuestion className="h-16 w-16 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="mt-2 text-xl font-semibold">Page not found</h2>
          <p className="mt-2 text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}
