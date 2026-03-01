"use client"

import { useEffect, useRef } from "react"

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const handleAuthClick = () => {
    window.location.assign("/app/auth?tab=signup")
  }

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
    <section className="py-20 sm:py-28 bg-black relative overflow-hidden" ref={sectionRef}>
      <div className="absolute inset-0 bg-indigo-900/5 pointer-events-none"></div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        <h2 className="reveal-on-scroll text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-8 max-w-5xl mx-auto">
          Your Trading Account Doesn&apos;t Lie. Neither Do We.
        </h2>
        <p className="reveal-on-scroll delay-100 text-lg sm:text-xl text-zinc-400 mb-12 max-w-4xl mx-auto leading-relaxed font-bold">
          You can keep doing what you&apos;re doing and getting the <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">same results</span>. Or you can start treating this like a <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">profession</span>.
        </p>
        <div className="reveal-on-scroll delay-200 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/app/auth?tab=signup"
            onClick={handleAuthClick}
            className="group relative overflow-hidden bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:via-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/50 shadow-lg"
          >
            <span className="flex items-center justify-center relative overflow-hidden h-6">
              <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Start Tracking Now</span>
              <span className="absolute top-[100%] left-0 transition-all duration-500 group-hover:translate-y-[-100%]">Start Tracking Now</span>
            </span>
            <span className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:left-[100%] transition-all duration-700" />
          </a>
        </div>
        <p className="reveal-on-scroll delay-300 mt-8 text-base sm:text-lg leading-relaxed font-bold">
          <span className="text-zinc-400">It takes </span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">less than 2 minutes</span>
          <span className="text-zinc-400"> to import your </span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">first trade</span>
          <span className="text-zinc-400">.</span>
        </p>
      </div>
    </section>
  )
}
