export default function Loading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex gap-3">
          <div className="flex-1 h-9 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-8">
          {["w-24", "w-20", "w-16"].map((w, i) => (
            <div key={i} className={`h-4 ${w} bg-gray-200 rounded animate-pulse`} />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-100 flex gap-8">
            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
