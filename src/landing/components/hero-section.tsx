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
        <h1 className="reveal-on-scroll text-3xl sm:text-5xl md:text-7xl leading-[1.1] font-black text-white tracking-tight mb-6 sm:mb-8">
          Treat Your Trading Like a <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Business.</span>
        </h1>
        <p className="reveal-on-scroll delay-100 text-base sm:text-lg md:text-xl font-semibold max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2">
          <span className="text-white">Real metrics. </span>
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent font-bold">Real feedback.</span>
          <span className="text-white"> Real accountability.</span>
        </p>

        <div className="reveal-on-scroll delay-200 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-20 px-4">
          <a
            href="/app/auth?tab=signup"
            onClick={handleAuthClick}
            className="group relative overflow-hidden bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:via-indigo-500 hover:to-purple-500 text-white text-sm font-bold px-8 py-3.5 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center gap-2 relative overflow-hidden h-5 w-full">
              <span className="transition-all duration-500 group-hover:translate-y-[-100%] w-full text-center">
                Get Started
              </span>
              <span className="absolute top-[100%] left-0 transition-all duration-500 group-hover:translate-y-[-100%] w-full text-center">
                Get started
              </span>
            </span>
            <span className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:left-[100%] transition-all duration-700" />
          </a>
        </div>

        <DashboardMockup />
      </div>
    </section>
  )
}
