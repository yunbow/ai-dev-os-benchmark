export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md text-center">
        <div className="text-6xl">🔧</div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Under Maintenance
        </h1>
        <p className="mt-4 text-gray-600">
          TaskFlow is currently undergoing scheduled maintenance. We will be
          back shortly. Thank you for your patience.
        </p>
        <p className="mt-4 text-sm text-gray-400">
          If you have urgent needs, please contact support.
        </p>
      </div>
    </div>
  );
}
