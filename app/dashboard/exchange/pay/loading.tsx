export default function Loading() {
  return (
    <div className="max-w-xl mx-auto space-y-5 animate-pulse">
      <div className="h-4 w-36 bg-gray-200 rounded" />
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 space-y-2">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
        <div className="p-5 space-y-5">
          <div className="bg-[#F7F9F8] rounded-xl p-4 space-y-3">
            <div className="h-4 w-36 bg-gray-200 rounded" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg p-3 space-y-2 border border-gray-200">
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-5 w-40 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 w-28 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-10 bg-gray-200 rounded-xl" />
          <div className="h-14 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
