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
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
            Journal Anywhere.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Precision in your pocket.</span>
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 mb-8 sm:mb-10 max-w-2xl leading-relaxed font-bold">
            MyTradeLog works seamlessly as a <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">mobile web app</span>. Add it to your home screen for a <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">native-like experience</span> without the App Store bloat. Access your stats, journal trades, and review performance on the go.
          </p>
          <ul className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
            <li className="flex items-center gap-3 text-zinc-400 text-base font-semibold">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              Fully responsive design for all devices
            </li>
            <li className="flex items-center gap-3 text-zinc-400 text-base font-semibold">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              Instant sync between desktop and mobile
            </li>
          </ul>
        </div>
        <div className="reveal-on-scroll flex items-center justify-center order-first lg:order-last">
          <img
            src="/images/mobile-app-preview.png"
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
