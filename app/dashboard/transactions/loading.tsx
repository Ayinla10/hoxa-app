export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Mobile skeleton */}
        <div className="lg:hidden divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-between px-4 py-4">
              <div className="space-y-2">
                <div className="h-3.5 w-44 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
        {/* Desktop skeleton */}
        <div className="hidden lg:block">
          <div className="border-b border-gray-100 px-5 py-3 flex gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-3 w-16 bg-gray-100 rounded" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-8 px-5 py-4 border-b border-gray-50">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-12 bg-gray-100 rounded" />
              <div className="h-5 w-16 bg-gray-200 rounded-lg" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-3 w-8 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
