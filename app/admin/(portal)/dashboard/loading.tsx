export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="h-8 bg-gray-100 rounded w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 h-28" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 h-72" />
        <div className="bg-white rounded-2xl border border-gray-200 h-72" />
      </div>
    </div>
  )
}
