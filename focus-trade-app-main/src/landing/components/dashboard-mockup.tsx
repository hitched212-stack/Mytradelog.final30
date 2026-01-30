"use client"

export function DashboardMockup() {
  return (
    <div className="reveal-on-scroll delay-300 relative max-w-6xl mx-auto rounded-xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden ring-1 ring-white/10">
      {/* Browser Header */}
      <div className="bg-zinc-950 border-b border-white/5 h-8 sm:h-10 flex items-center px-3 sm:px-4 gap-2 relative">
        <div className="flex gap-1 sm:gap-1.5">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bg-zinc-900 px-2 sm:px-3 py-1 rounded text-[10px] sm:text-xs text-zinc-500 font-mono">
          mytradelog.net
        </div>
      </div>

      {/* Dashboard Image */}
      <img
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-01-30%20at%2001.50.11-a91f42LTpefjt2kTrxqgRyowOEiIO3.png"
        alt="MyTradeLog Dashboard showing performance overview with $100,294,009.98 balance and recent trades"
        className="w-full h-auto"
        draggable={false}
        loading="lazy"
      />
    </div>
  )
}
