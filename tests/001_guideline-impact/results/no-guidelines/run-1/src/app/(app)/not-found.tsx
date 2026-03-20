import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
      <p className="text-sm text-gray-500 mb-6">
        The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
      </p>
      <Button asChild>
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
