export default function TasksLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-10 bg-gray-200 rounded-lg animate-pulse mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
