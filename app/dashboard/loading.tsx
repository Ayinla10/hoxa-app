export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero card skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 h-48" />

      {/* Two-column skeleton */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 h-64" />
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 h-24" />
          <div className="bg-white rounded-2xl border border-gray-200 h-24" />
          <div className="bg-white rounded-2xl border border-gray-200 h-24" />
        </div>
      </div>

      {/* Activity skeleton */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 h-64" />
        <div className="bg-white rounded-2xl border border-gray-200 h-48" />
      </div>
    </div>
  )
}
