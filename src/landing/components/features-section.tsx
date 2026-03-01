"use client"

import { useEffect, useRef } from "react"

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16 reveal-on-scroll">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            The System
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {/* Analyze Card */}
          <div className="reveal-on-scroll delay-100">
            <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-10 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-[1.02] h-full">
              <div className="mb-6">
                <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Analyze</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-500">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Detailed Trade Analysis</span>
              </h3>
              <p className="text-base text-zinc-400 leading-relaxed">
                Tag trades as "FOMO", "Revenge", or "Early Exit". See exactly how much your lack of discipline is costing you in dollars.
              </p>
            </div>
          </div>

          {/* Review Card */}
          <div className="reveal-on-scroll delay-200">
            <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-10 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-[1.02] h-full">
              <div className="mb-6">
                <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Review</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-500">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Mistake Tagging</span>
              </h3>
              <p className="text-base text-zinc-400 leading-relaxed">
                Stop generalizing. Drill down into specific setups, times of day, and assets. Find out where you actually make money.
              </p>
            </div>
          </div>

          {/* Improve Card */}
          <div className="reveal-on-scroll delay-300">
            <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-10 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-[1.02] h-full">
              <div className="mb-6">
                <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Improve</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-500">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Playbook Building</span>
              </h3>
              <p className="text-base text-zinc-400 leading-relaxed">
                Save your best trades. Build a library of what works. Replicate success instead of reinventing the wheel every morning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
