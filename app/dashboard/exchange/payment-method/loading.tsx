export default function Loading() {
  return (
    <div className="max-w-xl mx-auto space-y-5 animate-pulse">
      <div className="h-4 w-40 bg-gray-200 rounded" />
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 space-y-2">
          <div className="h-5 w-44 bg-gray-200 rounded" />
          <div className="h-3 w-64 bg-gray-100 rounded" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <div className="h-14 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
