export default function TasksLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-8" />

      <section className="mb-8">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
          <div className="h-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-9 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
      </section>

      <section>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
