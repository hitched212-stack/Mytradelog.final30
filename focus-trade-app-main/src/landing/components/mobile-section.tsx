"use client"

import { useEffect, useRef } from "react"
import { Smartphone, Zap } from "lucide-react"

export function MobileSection() {
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
    <section
      className="pt-24 sm:pt-32 lg:pt-40 pb-12 sm:pb-16 lg:pb-20 bg-black relative overflow-hidden scroll-mt-20"
      id="mobile"
      ref={sectionRef}
    >
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 z-10 max-w-7xl mx-auto px-4 sm:px-6 relative items-center">
        <div className="reveal-on-scroll">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-[10px] font-medium text-indigo-400 mb-4 sm:mb-6 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Mobile Optimized
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-medium text-white tracking-tight mb-4 leading-tight">
            Journal Anywhere.
            <br />
            <span className="text-zinc-500">Precision in your pocket.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 mb-6 sm:mb-8 max-w-md">
            MyTradeLog works seamlessly as a mobile web app. Add it to your home screen for a native-like experience
            without the App Store bloat. Access your stats, journal trades, and review performance on the go.
          </p>
          <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <li className="flex items-center gap-3 text-zinc-400 text-sm">
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Smartphone className="w-3 h-3 text-white" />
              </div>
              Fully responsive design for all devices
            </li>
            <li className="flex items-center gap-3 text-zinc-400 text-sm">
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Zap className="w-3 h-3 text-white" />
              </div>
              Instant sync between desktop and mobile
            </li>
          </ul>
        </div>
        <div className="reveal-on-scroll flex items-center justify-center order-first lg:order-last">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-01-30%20at%2014.18.28-krDi61I0eal2wAmO7qYareLZg7ibHn.png"
            alt="MyTradeLog mobile app showing trading dashboard and calendar views"
            width={1200}
            height={1000}
            className="w-full h-auto max-w-sm sm:max-w-md lg:max-w-xl xl:max-w-2xl object-contain"
            draggable={false}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
