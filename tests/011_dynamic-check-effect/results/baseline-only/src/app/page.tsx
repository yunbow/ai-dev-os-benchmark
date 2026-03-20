import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">TaskFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Manage Tasks with{" "}
          <span className="text-indigo-600">Confidence</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          TaskFlow helps you organize, prioritize, and collaborate on tasks seamlessly.
          Built for individuals and teams who want to get things done.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 font-semibold text-lg transition-colors shadow-lg shadow-indigo-200"
          >
            Start for Free
          </Link>
          <Link
            href="/login"
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl hover:bg-indigo-50 font-semibold text-lg transition-colors border-2 border-indigo-200"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Task Management",
              description:
                "Create, organize, and track tasks with priorities, due dates, and categories. Full-text search and powerful filters.",
              icon: "✓",
            },
            {
              title: "Team Collaboration",
              description:
                "Invite team members, assign roles, and collaborate in real-time. Control access with Owner, Member, and Viewer roles.",
              icon: "👥",
            },
            {
              title: "Smart Organization",
              description:
                "Color-coded categories, status tracking, and priority management keep your workflow clear and efficient.",
              icon: "🗂",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t bg-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
