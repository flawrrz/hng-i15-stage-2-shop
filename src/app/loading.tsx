export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-black animate-spin" />
        </div>
        <p className="text-sm text-gray-500">Loading page...</p>
      </div>
    </div>
  );
}
