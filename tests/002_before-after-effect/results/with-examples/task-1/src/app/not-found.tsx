import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-600">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Go home
      </Link>
    </div>
  );
}
