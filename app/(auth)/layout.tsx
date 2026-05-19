export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2e1a] via-[#177945] to-[#0d4a2c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/hoxa-logo-white.png" alt="HOXA" className="h-10 mx-auto" />
          <p className="text-white/50 text-sm mt-3">Secure P2P Currency Exchange</p>
        </div>
        {children}
      </div>
    </div>
  )
}
