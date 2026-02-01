"use client"

import { useEffect, useRef } from "react"

export function PricingSection() {
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
    <section className="py-16 sm:py-24 bg-black scroll-mt-16" id="pricing" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16 reveal-on-scroll">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-medium text-white tracking-tight mb-4">
            Invest In Your Business
          </h2>
          <p className="text-base sm:text-lg text-zinc-400">
            If MyTradeLog helps you avoid just one revenge trade, one moment of overtrading, one emotional decision — it pays for itself many times over.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto py-10 sm:py-20 px-2 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* ANNUAL PLAN (RECOMMENDED) */}
            <div className="group relative reveal-on-scroll delay-100">
              <div className="relative w-full overflow-visible [perspective:1200px]">
                {/* Purple Glow */}
                <div className="absolute -inset-2 rounded-3xl bg-indigo-500/15 blur-xl opacity-60 transition-all duration-700 group-hover:opacity-80 group-hover:blur-2xl"></div>

                {/* Back page */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-indigo-600/30 to-indigo-800/40 ring-1 ring-white/10 shadow-2xl [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:[transform:rotateY(45deg)_translateX(-20px)_translateZ(-30px)_translateY(-15px)_scale(0.95)]"></div>

                {/* Front card */}
                <div className="relative z-10 rounded-2xl p-6 sm:p-8 h-full bg-zinc-900/80 border border-indigo-400/30 shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_12px_32px_rgba(99,102,241,0.25)] [transform-style:preserve-3d] origin-left transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:[transform:rotateY(-10deg)_translateY(-12px)_translateZ(10px)] transform-gpu">
                  {/* Badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-wide text-white bg-indigo-500 px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                    SAVE 34% RECOMMENDED
                  </div>

                  <h3 className="text-lg sm:text-xl font-medium text-white mb-2 mt-2">Serious Trader (Annual)</h3>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl sm:text-4xl font-bold text-white">$19</span>
                    <span className="text-zinc-500">/mo</span>
                  </div>

                  <p className="text-sm text-zinc-400 mb-4 sm:mb-6 italic">
                    &quot;For traders who actually plan to still be trading next year.&quot;
                  </p>

                  <p className="text-xs text-zinc-500 mb-6 sm:mb-8">Billed $228 annually.   </p>

                  <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    <li className="flex items-center gap-3 text-sm text-zinc-300">✔ Unlimited Trade Imports</li>
                    <li className="flex items-center gap-3 text-sm text-zinc-300">✔ Advanced Analytics</li>
                  </ul>

                  <a
                    href="/app/auth?tab=signup"
                    className="block w-full bg-white text-zinc-950 text-center py-3 rounded-lg text-sm font-medium transition-all hover:bg-zinc-200 hover:-translate-y-0.5"
                  >
                    Commit for a Year
                  </a>
                </div>
              </div>
            </div>

            {/* MONTHLY PLAN */}
            <div className="group relative reveal-on-scroll delay-200">
              <div className="relative w-full overflow-visible [perspective:1200px]">
                {/* Back page */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-500/10 via-zinc-600/20 to-zinc-800/30 ring-1 ring-white/10 shadow-2xl [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:[transform:rotateY(45deg)_translateX(-20px)_translateZ(-30px)_translateY(-15px)_scale(0.95)]"></div>

                {/* Front card */}
                <div className="relative z-10 rounded-2xl p-6 sm:p-8 h-full bg-zinc-900/70 border border-white/10 shadow-2xl [transform-style:preserve-3d] origin-left transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:[transform:rotateY(-10deg)_translateY(-12px)_translateZ(10px)] transform-gpu">
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-2">Flexible (Monthly)</h3>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl sm:text-4xl font-bold text-white">$29</span>
                    <span className="text-zinc-500">/mo</span>
                  </div>

                  <p className="text-sm text-zinc-400 mb-4 sm:mb-6 italic">
                    &quot;For people who are afraid of commitment.&quot;
                  </p>

                  <p className="text-xs text-zinc-500 mb-6 sm:mb-8">Billed monthly. Cancel anytime.</p>

                  <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    <li className="flex items-center gap-3 text-sm text-zinc-300">✔ Unlimited Trade Imports</li>
                    <li className="flex items-center gap-3 text-sm text-zinc-300">✔ Advanced Analytics</li>
                  </ul>

                  <a
                    href="/app/auth?tab=signup"
                    className="block w-full border border-white/10 text-white text-center py-3 rounded-lg text-sm font-medium transition-all hover:bg-white/5 hover:-translate-y-0.5"
                  >
                    Start Monthly
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
