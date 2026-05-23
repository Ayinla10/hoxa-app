export default function Loading() {
  return (
    <div className="max-w-xl mx-auto space-y-5 animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto" />
          <div className="h-5 w-48 bg-gray-200 rounded mx-auto" />
          <div className="h-3 w-32 bg-gray-100 rounded mx-auto" />
        </div>
        <div className="bg-[#F7F9F8] rounded-xl p-5 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-3.5 w-24 bg-gray-200 rounded" />
              <div className="h-3.5 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded-xl" />
          <div className="h-10 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-14 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}
