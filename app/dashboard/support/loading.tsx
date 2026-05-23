export default function SupportLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-40 bg-gray-200 rounded-lg" />
        <div className="h-4 w-60 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            <div className="h-4 w-24 bg-gray-200 rounded-lg" />
            <div className="h-3 w-full bg-gray-100 rounded-lg" />
            <div className="h-9 w-28 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
