"use client"

import { useEffect, useRef } from "react"
import {
  LayoutDashboard,
  Target,
  Layers,
  History,
} from "lucide-react"

export function HighlightsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = sectionRef.current?.querySelectorAll(".reveal-on-scroll")
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <section className="bg-gradient-to-b from-black via-zinc-950 to-black pt-20 pb-20 sm:pt-28 sm:pb-28" id="highlights" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-20 sm:mb-24 reveal-on-scroll">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-8">
            Your complete system for trading performance.
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Track everything that matters so you can trade with clarity and confidence.
          </p>
        </div>

        {/* Diamond Layout */}
        <div className="relative max-w-5xl mx-auto">
          {/* Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-8 md:mb-16">
            {/* Dashboard Card */}
            <div className="reveal-on-scroll delay-100">
              <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-10 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-105">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl flex items-center justify-center mb-6 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500 shadow-lg">
                    <LayoutDashboard className="w-8 h-8 text-zinc-300 group-hover:text-indigo-400 transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-500">Dashboard</h3>
                  <p className="text-base text-zinc-400 leading-relaxed">
                    Complete overview of your trading performance at a glance
                  </p>
                </div>
              </div>
            </div>

            {/* Goal Setting Card */}
            <div className="reveal-on-scroll delay-200">
              <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-10 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-105">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl flex items-center justify-center mb-6 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500 shadow-lg">
                    <Target className="w-8 h-8 text-zinc-300 group-hover:text-indigo-400 transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-500">Goal Setting</h3>
                  <p className="text-base text-zinc-400 leading-relaxed">
                    Set targets and track your progress
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Circle with Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block reveal-on-scroll delay-150">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full opacity-20 blur-2xl animate-pulse"></div>
              <div className="relative w-28 h-28 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/50 border-4 border-zinc-900">
                <img 
                  src="/images/landing-page-logo.png" 
                  alt="MyTradeLog" 
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Bottom Row */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {/* Playbook Card */}
            <div className="reveal-on-scroll delay-300">
              <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-10 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-105">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl flex items-center justify-center mb-6 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500 shadow-lg">
                    <Layers className="w-8 h-8 text-zinc-300 group-hover:text-indigo-400 transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-500">Playbook</h3>
                  <p className="text-base text-zinc-400 leading-relaxed">
                    Document and refine your trading setups
                  </p>
                </div>
              </div>
            </div>

            {/* Trade History Card */}
            <div className="reveal-on-scroll delay-400">
              <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-10 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-105">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl flex items-center justify-center mb-6 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500 shadow-lg">
                    <History className="w-8 h-8 text-zinc-300 group-hover:text-indigo-400 transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-500">Trade History</h3>
                  <p className="text-base text-zinc-400 leading-relaxed">
                    Detailed log of all your past trades with full metrics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
