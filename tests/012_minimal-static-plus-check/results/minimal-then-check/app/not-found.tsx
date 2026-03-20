import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">Page not found</h2>
        <p className="text-gray-600 mt-2">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
