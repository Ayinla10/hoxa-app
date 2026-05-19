export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Topbar skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 h-12" />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 h-28" />
        ))}
      </div>

      {/* Content area */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 h-64" />
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 h-48" />
          <div className="bg-white rounded-2xl border border-gray-200 h-36" />
        </div>
      </div>
    </div>
  )
}
