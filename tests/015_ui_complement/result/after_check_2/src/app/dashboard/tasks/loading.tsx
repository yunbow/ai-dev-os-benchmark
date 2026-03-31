export default function TasksLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 h-8 w-40 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* フォーム skeleton */}
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-full animate-pulse rounded bg-blue-200" />
        </div>
        {/* テーブル skeleton */}
        <div className="space-y-2 lg:col-span-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-full animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
