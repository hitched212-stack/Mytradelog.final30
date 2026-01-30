"use client"

import { useEffect, useRef } from "react"
import { Microscope, ShieldAlert, Target } from "lucide-react"

export function FeaturesSection() {
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
    <section className="bg-black pt-16 pb-16 sm:pt-24 sm:pb-24" id="features" ref={sectionRef}>
      <div className="grid lg:grid-cols-2 max-w-7xl mx-auto px-4 sm:px-6 gap-10 lg:gap-16 items-center">
        <div className="reveal-on-scroll">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-medium text-white tracking-tight mb-4">
            {"You're Not \"Unlucky\""} <br />
            {"You're Uninformed."}
          </h2>
          <div className="space-y-4 sm:space-y-6 text-base sm:text-lg text-zinc-400">
            <p>
              Most traders lose because they treat trading like gambling. They enter positions based on gut feelings,
              exit based on panic, and never review what happened.
            </p>
            <p>
              If you aren&apos;t tracking your stats, you are guessing. And guessing is not a strategy. It&apos;s a
              donation to the market.
            </p>
            <p className="text-white font-medium border-l-2 border-indigo-500 pl-4">
              MyTradeLog forces you to confront the data. It highlights your bad habits, exposes your weaknesses, and
              gives you the objective truth you&apos;ve been avoiding.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* Feature Card 1 */}
          <div className="reveal-on-scroll delay-100 group relative [perspective:1000px]">
            <div className="absolute inset-0 bg-zinc-800 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(-8deg)_translateY(8px)] group-hover:opacity-50"></div>
            <div className="relative bg-zinc-900 border border-white/5 p-5 sm:p-6 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_translateY(-4px)] group-hover:border-indigo-500/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
              <div className="w-10 h-10 bg-indigo-500/10 flex items-center justify-center rounded-lg mb-4 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <Microscope className="w-5 h-5" strokeWidth={1} />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-white mb-2">Detailed Trade Analysis</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Stop generalizing. Drill down into specific setups, times of day, and assets. Find out where you
                actually make money.
              </p>
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="reveal-on-scroll delay-200 group relative [perspective:1000px]">
            <div className="absolute inset-0 bg-zinc-800 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(-8deg)_translateY(8px)] group-hover:opacity-50"></div>
            <div className="relative bg-zinc-900 border border-white/5 p-5 sm:p-6 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_translateY(-4px)] group-hover:border-indigo-500/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
              <div className="w-10 h-10 bg-indigo-500/10 flex items-center justify-center rounded-lg mb-4 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <ShieldAlert className="w-5 h-5" strokeWidth={1} />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-white mb-2">Mistake Tagging</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Tag trades as &quot;FOMO&quot;, &quot;Revenge&quot;, or &quot;Early Exit&quot;. See exactly how much
                your lack of discipline is costing you in dollars.
              </p>
            </div>
          </div>

          {/* Feature Card 3 */}
          <div className="reveal-on-scroll delay-300 group relative [perspective:1000px]">
            <div className="absolute inset-0 bg-zinc-800 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(-8deg)_translateY(8px)] group-hover:opacity-50"></div>
            <div className="relative bg-zinc-900 border border-white/5 p-5 sm:p-6 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_translateY(-4px)] group-hover:border-indigo-500/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
              <div className="w-10 h-10 bg-indigo-500/10 flex items-center justify-center rounded-lg mb-4 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <Target className="w-5 h-5" strokeWidth={1} />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-white mb-2">Playbook Building</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Save your best trades. Build a library of what works. Replicate success instead of reinventing the wheel
                every morning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
