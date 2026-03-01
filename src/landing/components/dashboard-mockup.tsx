"use client"

export function DashboardMockup() {
  return (
    <div className="reveal-on-scroll delay-300 relative max-w-6xl mx-auto overflow-visible">
      <div className="relative z-10 rounded-[1.25rem] p-[1px] bg-gradient-to-r from-indigo-500/45 via-white/15 to-purple-500/45 shadow-[0_20px_80px_rgba(40,20,80,0.45)]">
        <div className="rounded-[1.18rem] overflow-hidden bg-[#0a0a0a] border border-white/5 ring-1 ring-white/[0.02]">
          {/* Modern Dark Browser Header */}
          <div className="bg-[#0f0f0f] border-b border-white/[0.06] h-10 sm:h-12 flex items-center px-4 sm:px-5 relative backdrop-blur-xl">
            {/* Window Controls - Minimal */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-700/40 hover:bg-zinc-600/60 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-zinc-700/40 hover:bg-zinc-600/60 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-zinc-700/40 hover:bg-zinc-600/60 transition-colors"></div>
            </div>

            {/* Sleek URL Bar */}
            <div className="absolute left-1/2 -translate-x-1/2 w-[45%] sm:w-[38%] min-w-[160px] max-w-[320px] h-7 sm:h-8 rounded-lg border border-white/[0.08] bg-black/40 backdrop-blur-md flex items-center px-3 gap-2 shadow-inner shadow-black/20">
              <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-[11px] sm:text-xs text-zinc-400 font-medium tracking-tight">mytradelog.net</span>
            </div>
          </div>

          {/* Dashboard Image */}
          <img
            src="/images/dashboard-preview.png"
            alt="MyTradeLog Dashboard showing performance overview with balance and recent trades"
            className="block w-full h-auto"
            draggable={false}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  )
}
