"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"

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

  const excuses = [
    {
      title: "I already journal in Excel.",
      response: "Excel is a spreadsheet, not a trading tool. It doesn't calculate your win rate by setup automatically. It doesn't visualize your equity curve. And let's be honest—you don't actually review those rows of data. You just type them in and forget them."
    },
    {
      title: "I'll start tracking when I'm profitable.",
      response: "That's backwards. You don't get fit to go to the gym; you go to the gym to get fit. You won't become profitable until you start tracking your mistakes and eliminating them. Waiting is just procrastination."
    },
    {
      title: "It costs money.",
      response: "One bad trade caused by emotion costs more than a year of this software. The price is insignificant compared to the cost of your ignorance."
    }
  ]

  return (
    <section className="pt-20 pb-20 sm:pt-28 sm:pb-28 bg-black" id="faq" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="reveal-on-scroll text-center mb-16 sm:mb-20">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
            Stop Making Excuses
          </h2>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed font-semibold">
            <span className="text-zinc-400">Every trader has the same </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">objections</span>
            <span className="text-zinc-400">. Here's why they </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">don't hold up</span>
            <span className="text-zinc-400">.</span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {excuses.map((excuse, index) => (
            <div 
              key={index}
              className={`reveal-on-scroll delay-${(index + 1) * 100} group`}
            >
              <div className="relative h-full bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-8 sm:p-10 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-[1.02]">
                {/* X Icon at top */}
                <div className="flex items-center justify-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center group-hover:border-purple-500/50 group-hover:bg-purple-500/20 transition-all duration-500">
                    <X className="w-7 h-7 text-purple-500" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Excuse title */}
                <div className="mb-6 text-center">
                  <p className="text-lg sm:text-xl font-bold text-indigo-400 leading-snug">
                    "{excuse.title}"
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-6"></div>

                {/* Response */}
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed text-center font-semibold">
                  {excuse.response}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
