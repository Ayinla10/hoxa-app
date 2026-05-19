export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-48" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-56" />
              <div className="h-3 bg-gray-100 rounded w-36" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 bg-gray-100 rounded-xl w-20" />
              <div className="h-9 bg-gray-100 rounded-xl w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
