export default function TasksLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-8" />
      <div className="bg-white border rounded-lg p-6 mb-8 space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-20 bg-gray-100 rounded animate-pulse" />
        <div className="h-9 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
