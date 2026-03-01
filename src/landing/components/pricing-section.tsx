"use client"

import { useEffect, useRef, useState } from "react"
import { Switch } from "@/components/ui/switch"

export function PricingSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isAnnual, setIsAnnual] = useState(true)

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
    <section className="py-20 sm:py-28 bg-black scroll-mt-4" id="pricing" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 sm:mb-20 reveal-on-scroll">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-8">
            Invest In Your Business
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl max-w-5xl mx-auto leading-relaxed font-bold">
            <span className="text-zinc-400">If MyTradeLog helps you avoid just </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">one revenge trade</span>
            <span className="text-zinc-400">, </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">one moment of overtrading</span>
            <span className="text-zinc-400">, </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">one emotional decision</span>
            <span className="text-zinc-400"> — it pays for itself many times over.</span>
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto py-2 sm:py-4 px-2 sm:px-6">
          {/* Mobile Switch - Only visible on small screens */}
          <div className="sm:hidden flex items-center justify-center mb-10">
            <div className="relative inline-flex items-center bg-gradient-to-r from-zinc-900/60 to-zinc-800/60 backdrop-blur-xl rounded-full p-1 border border-zinc-700/50 shadow-lg shadow-black/50">
              {/* Annual Label */}
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 relative z-10 ${
                  isAnnual
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Annual
              </button>

              {/* Animated Slider Background */}
              <div
                className={`absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 ease-out shadow-lg shadow-indigo-500/50 ${
                  isAnnual
                    ? 'left-1 w-[calc(50%-2px)]'
                    : 'left-[calc(50%-1px)] w-[calc(50%-2px)]'
                }`}
              />

              {/* Monthly Label */}
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 relative z-10 ${
                  !isAnnual
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Mobile Layout - Single card based on switch */}
          <div className="sm:hidden flex justify-center">
            {isAnnual ? (
              <div className="reveal-on-scroll w-full">
                <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-indigo-500/40 rounded-3xl p-10 hover:border-indigo-500/60 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 h-full">
                  {/* Badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    SAVE 34% RECOMMENDED
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-5xl font-bold text-white">$19</span>
                      <span className="text-zinc-400 text-lg">/mo</span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">Serious Trader</h3>
                    <p className="text-sm text-zinc-400 mb-6">Annual Plan</p>

                    <p className="text-sm text-zinc-300 mb-6 italic leading-relaxed">
                      &quot;For traders who actually plan to still be trading next year.&quot;
                    </p>

                    <p className="text-xs text-zinc-500 mb-8 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      Billed $228 annually
                    </p>

                    <ul className="space-y-4 mb-10">
                      <li className="flex items-start gap-3 text-sm text-zinc-300">
                        <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                        <span>Unlimited Trade Imports</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-zinc-300">
                        <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                        <span>Advanced Analytics</span>
                      </li>
                    </ul>

                    <a
                      href="/app/auth?tab=signup"
                      className="group relative overflow-hidden block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-center py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105"
                    >
                      <span className="flex items-center justify-center relative overflow-hidden h-6">
                        <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Commit for a Year</span>
                        <span className="absolute top-[100%] left-1/2 -translate-x-1/2 transition-all duration-500 group-hover:translate-y-[-100%]">Commit for a Year</span>
                      </span>
                      <span className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="reveal-on-scroll w-full">
                <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-10 hover:border-zinc-700/60 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-500/10 h-full">
                  <div>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-5xl font-bold text-white">$29</span>
                      <span className="text-zinc-400 text-lg">/mo</span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">Flexible</h3>
                    <p className="text-sm text-zinc-400 mb-6">Monthly Plan</p>

                    <p className="text-sm text-zinc-300 mb-6 italic leading-relaxed">
                      &quot;For people who are afraid of commitment.&quot;
                    </p>

                    <p className="text-xs text-zinc-500 mb-8 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                      Billed monthly. Cancel anytime.
                    </p>

                    <ul className="space-y-4 mb-10">
                      <li className="flex items-start gap-3 text-sm text-zinc-300">
                        <span className="text-zinc-400 font-bold mt-0.5">✓</span>
                        <span>Unlimited Trade Imports</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-zinc-300">
                        <span className="text-zinc-400 font-bold mt-0.5">✓</span>
                        <span>Advanced Analytics</span>
                      </li>
                    </ul>

                    <a
                      href="/app/auth?tab=signup"
                      className="group relative overflow-hidden block w-full bg-white/15 hover:bg-white/20 text-white text-center py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-md hover:shadow-white/10 hover:scale-105"
                    >
                      <span className="flex items-center justify-center relative overflow-hidden h-6">
                        <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Start Monthly</span>
                        <span className="absolute top-[100%] left-1/2 -translate-x-1/2 transition-all duration-500 group-hover:translate-y-[-100%]">Start Monthly</span>
                      </span>
                      <span className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop/Tablet Layout - Side by side */}
          <div className="hidden sm:grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* ANNUAL PLAN (RECOMMENDED) */}
            <div className="reveal-on-scroll delay-100">
              <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-indigo-500/40 rounded-3xl p-10 hover:border-indigo-500/60 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 hover:scale-[1.02] h-full">
                {/* Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  SAVE 34% RECOMMENDED
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-bold text-white">$19</span>
                    <span className="text-zinc-400 text-lg">/mo</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">Serious Trader</h3>
                  <p className="text-sm text-zinc-400 mb-6">Annual Plan</p>

                  <p className="text-sm text-zinc-300 mb-6 italic leading-relaxed">
                    &quot;For traders who actually plan to still be trading next year.&quot;
                  </p>

                  <p className="text-xs text-zinc-500 mb-8 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Billed $228 annually
                  </p>

                  <ul className="space-y-4 mb-10">
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                      <span>Unlimited Trade Imports</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                      <span>Advanced Analytics</span>
                    </li>
                  </ul>

                  <a
                    href="/app/auth?tab=signup"
                    className="group relative overflow-hidden block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-center py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105"
                  >
                    <span className="flex items-center justify-center relative overflow-hidden h-6">
                      <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Commit for a Year</span>
                      <span className="absolute top-[100%] left-1/2 -translate-x-1/2 transition-all duration-500 group-hover:translate-y-[-100%]">Commit for a Year</span>
                    </span>
                    <span className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
                  </a>
                </div>
              </div>
            </div>

            {/* MONTHLY PLAN */}
            <div className="reveal-on-scroll delay-200">
              <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-10 hover:border-zinc-700/60 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-500/10 hover:scale-[1.02] h-full">
                <div>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-bold text-white">$29</span>
                    <span className="text-zinc-400 text-lg">/mo</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">Flexible</h3>
                  <p className="text-sm text-zinc-400 mb-6">Monthly Plan</p>

                  <p className="text-sm text-zinc-300 mb-6 italic leading-relaxed">
                    &quot;For people who are afraid of commitment.&quot;
                  </p>

                  <p className="text-xs text-zinc-500 mb-8 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                    Billed monthly. Cancel anytime.
                  </p>

                  <ul className="space-y-4 mb-10">
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <span className="text-zinc-400 font-bold mt-0.5">✓</span>
                      <span>Unlimited Trade Imports</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <span className="text-zinc-400 font-bold mt-0.5">✓</span>
                      <span>Advanced Analytics</span>
                    </li>
                  </ul>

                  <a
                    href="/app/auth?tab=signup"
                    className="group relative overflow-hidden block w-full bg-white/15 hover:bg-white/20 text-white text-center py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-md hover:shadow-white/10 hover:scale-105"
                  >
                    <span className="flex items-center justify-center relative overflow-hidden h-6">
                      <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Start Monthly</span>
                      <span className="absolute top-[100%] left-1/2 -translate-x-1/2 transition-all duration-500 group-hover:translate-y-[-100%]">Start Monthly</span>
                    </span>
                    <span className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
