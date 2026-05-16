export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2e1a] via-[#0F6A3D] to-[#0d4a2c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <span className="text-[#0F6A3D] font-bold text-lg">H</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">HOXA</span>
          </div>
          <p className="text-white/50 text-sm mt-2">Secure P2P Currency Exchange</p>
        </div>
        {children}
      </div>
    </div>
  )
}
