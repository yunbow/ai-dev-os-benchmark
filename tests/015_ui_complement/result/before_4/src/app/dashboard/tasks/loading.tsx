export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        <div className="h-32 bg-gray-200 rounded mb-8" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
