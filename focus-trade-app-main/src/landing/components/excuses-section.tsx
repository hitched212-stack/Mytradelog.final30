"use client"

import { useEffect, useRef } from "react"
import { CircleDollarSign, Clock, DollarSign } from "lucide-react"

export function ExcusesSection() {
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
    <section className="pt-16 pb-16 sm:pt-24 sm:pb-24 bg-black" id="faq" ref={sectionRef}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="reveal-on-scroll text-2xl sm:text-3xl md:text-5xl font-medium text-white tracking-tight text-center mb-4">
          Common Excuses That Keep You Stuck 
        </h2>

        <div className="space-y-3 sm:space-y-4">
          <div className="reveal-on-scroll delay-100 group relative [perspective:1000px]">
            <div className="absolute inset-0 bg-zinc-800 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(-8deg)_translateY(8px)] group-hover:opacity-50"></div>
            <div className="relative bg-zinc-900 border border-white/5 p-4 sm:p-6 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_translateY(-4px)] group-hover:border-indigo-500/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
              <div className="flex items-start gap-3 sm:gap-4">
                <CircleDollarSign className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-1 text-indigo-400" strokeWidth={1} />
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                    &quot;I already journal in Excel.&quot;
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Excel is a spreadsheet, not a trading tool. It doesn&apos;t calculate your win rate by setup
                    automatically. It doesn&apos;t visualize your equity curve. And let&apos;s be honest—you don&apos;t
                    actually review those rows of data. You just type them in and forget them.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="reveal-on-scroll delay-200 group relative [perspective:1000px]">
            <div className="absolute inset-0 bg-zinc-800 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(-8deg)_translateY(8px)] group-hover:opacity-50"></div>
            <div className="relative bg-zinc-900 border border-white/5 p-4 sm:p-6 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_translateY(-4px)] group-hover:border-indigo-500/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
              <div className="flex items-start gap-3 sm:gap-4">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-1 text-indigo-400" strokeWidth={1} />
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                    &quot;I&apos;ll start tracking when I&apos;m profitable.&quot;
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    That&apos;s backwards. You don&apos;t get fit to go to the gym; you go to the gym to get fit. You
                    won&apos;t become profitable until you start tracking your mistakes and eliminating them. Waiting is
                    just procrastination.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="reveal-on-scroll delay-300 group relative [perspective:1000px]">
            <div className="absolute inset-0 bg-zinc-800 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(-8deg)_translateY(8px)] group-hover:opacity-50"></div>
            <div className="relative bg-zinc-900 border border-white/5 p-4 sm:p-6 rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_translateY(-4px)] group-hover:border-indigo-500/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
              <div className="flex items-start gap-3 sm:gap-4">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-1 text-indigo-400" strokeWidth={1} />
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-white mb-2">&quot;It costs money.&quot;</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    One bad trade caused by emotion costs more than a year of this software. The price is insignificant
                    compared to the cost of your ignorance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
