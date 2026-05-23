export default function Loading() {
  return (
    <div className="max-w-xl mx-auto space-y-5 animate-pulse">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-8 text-center border-b border-gray-100 space-y-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto" />
          <div className="h-5 w-52 bg-gray-200 rounded mx-auto" />
          <div className="h-3 w-40 bg-gray-100 rounded mx-auto" />
        </div>
        <div className="p-6 space-y-6">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gray-200 rounded-full" />
              <div className="h-3.5 w-44 bg-gray-200 rounded" />
            </div>
          ))}
          <div className="bg-[#F7F9F8] rounded-xl p-4 h-16" />
          <div className="h-10 bg-gray-200 rounded-xl" />
          <div className="h-10 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
