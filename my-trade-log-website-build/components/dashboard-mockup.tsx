"use client"

import { MoreHorizontal } from "lucide-react"

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
      />
    </div>
  )
}

function TradeItem({
  symbol,
  type,
  date,
  amount,
  percent,
  isProfit,
  flagBg,
  iconBg,
  iconText,
}: {
  symbol: string
  type: "Long" | "Short"
  date: string
  amount: string
  percent: string
  isProfit: boolean
  flagBg?: string
  iconBg?: string
  iconText?: string
}) {
  return (
    <div className="bg-white border border-zinc-100 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between hover:shadow-md transition-shadow hover:border-zinc-200">
      <div className="flex items-center gap-2 sm:gap-4">
        {flagBg ? (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 relative overflow-hidden">
            <div className={`absolute inset-0 ${flagBg} flex items-center justify-center`}>
              <div className="w-full h-[1px] bg-red-500 rotate-45 absolute"></div>
              <div className="w-full h-[1px] bg-red-500 -rotate-45 absolute"></div>
              <div className="w-full h-[1px] bg-white"></div>
              <div className="h-full w-[1px] bg-white"></div>
            </div>
          </div>
        ) : (
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0 text-white text-[8px] sm:text-[10px] font-bold`}
          >
            {iconText || <CoffeeIcon />}
          </div>
        )}
        <div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-bold text-xs sm:text-sm text-zinc-900">{symbol}</span>
            <span
              className={`px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-semibold tracking-wide uppercase ${
                type === "Long" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}
            >
              {type}
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">{date}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-6">
        <div className="text-right">
          <div className={`text-xs sm:text-sm font-bold ${isProfit ? "text-emerald-500" : "text-red-500"}`}>
            {amount}
          </div>
          <div
            className={`text-[8px] sm:text-[10px] font-medium ${isProfit ? "text-emerald-500" : "text-red-500"} hidden sm:block`}
          >
            {percent}
          </div>
        </div>
        <button className="text-zinc-400 hover:text-zinc-900 hidden sm:block">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function CoffeeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-6 sm:h-6">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm2-4h-2V7h2v6z" />
    </svg>
  )
}
