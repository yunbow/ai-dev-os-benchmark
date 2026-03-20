export default function TeamsLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="flex gap-3 mb-8">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
          </div>
        ))}
      </div>
    </main>
  );
}
