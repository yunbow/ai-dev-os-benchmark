import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-gray-900">TaskFlow</h1>
      <p className="text-lg text-gray-600">Team task management made simple</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
