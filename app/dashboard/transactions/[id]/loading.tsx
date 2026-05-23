export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
      <div className="h-4 w-36 bg-gray-200 rounded" />

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-gray-100 rounded" />
            <div className="h-7 w-64 bg-gray-200 rounded" />
            <div className="h-3 w-36 bg-gray-100 rounded" />
          </div>
          <div className="space-y-2 items-end">
            <div className="h-3 w-28 bg-gray-100 rounded" />
            <div className="h-5 w-20 bg-gray-200 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-[#F7F9F8] rounded-xl">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-36 bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="h-2 w-14 bg-gray-100 rounded mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Details card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex justify-between">
            <div className="h-3.5 w-20 bg-gray-100 rounded" />
            <div className="h-3.5 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
