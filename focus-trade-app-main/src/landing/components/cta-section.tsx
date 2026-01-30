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
    <section className="py-32 relative overflow-hidden" ref={sectionRef}>
      <div className="absolute inset-0 bg-indigo-900/5 pointer-events-none"></div>
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <h2 className="reveal-on-scroll text-4xl md:text-5xl font-medium text-white tracking-tight mb-8">
          Your Trading Account Doesn&apos;t Lie. Neither Do We.
        </h2>
        <p className="reveal-on-scroll delay-100 text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
          You can keep doing what you&apos;re doing and getting the same results. Or you can start treating this like a
          profession.
        </p>
        <div className="reveal-on-scroll delay-200 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/app/auth?tab=signup"
            onClick={handleAuthClick}
            className="group relative overflow-hidden bg-white text-zinc-950 px-8 py-4 rounded-lg text-lg font-medium hover:bg-zinc-100 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] hover:scale-105"
          >
            Start Tracking Now
            <span className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:left-[100%] transition-all duration-500" />
          </a>
        </div>
        <p className="reveal-on-scroll delay-300 mt-6 text-sm text-zinc-500">
          It takes less than 2 minutes to import your first trade.
        </p>
      </div>
    </section>
  )
}
