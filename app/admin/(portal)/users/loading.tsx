export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse p-6">
      <div className="h-8 bg-gray-100 rounded w-28" />
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 last:border-0">
            <div className="w-10 h-10 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-36" />
              <div className="h-3 bg-gray-100 rounded w-48" />
            </div>
            <div className="h-6 bg-gray-100 rounded-full w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
