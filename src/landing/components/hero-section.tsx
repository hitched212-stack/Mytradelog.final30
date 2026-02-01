"use client"

import { useEffect, useRef } from "react"
import { ArrowRight } from "lucide-react"
import { DashboardMockup } from "./dashboard-mockup"

export function HeroSection() {
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
    <section className="overflow-hidden pt-24 sm:pt-32 pb-12 sm:pb-20 relative" ref={sectionRef}>
      <div className="text-center max-w-7xl mx-auto px-4 sm:px-6 relative">
        <h1 className="reveal-on-scroll text-3xl sm:text-5xl md:text-7xl leading-[1.1] font-medium text-white tracking-tight mb-6 sm:mb-8">
          Stop Repeating <br />
          The Same <span className="text-indigo-400">Losing Mistakes</span>
        </h1>
        <p className="reveal-on-scroll delay-100 text-base sm:text-lg md:text-xl font-light text-zinc-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2">
          MyTradeLog turns every trade into structured data so you can see exactly what&apos;s costing you money — and fix
          it.
        </p>

        <div className="reveal-on-scroll delay-200 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-20 px-4">
          <a
            href="/app/auth?tab=signup"
            onClick={handleAuthClick}
            className="group relative overflow-hidden sm:w-auto transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)] text-sm font-medium text-zinc-950 bg-white w-full border-transparent border rounded-lg py-3.5 px-8 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
          >
            <span className="flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:left-[100%] transition-all duration-500" />
          </a>
        </div>

        <DashboardMockup />
      </div>
    </section>
  )
}
