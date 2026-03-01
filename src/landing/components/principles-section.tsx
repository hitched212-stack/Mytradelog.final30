"use client"

import { useEffect, useRef, useState } from "react"

export function PrinciplesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const [lineHeight, setLineHeight] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
          }
        })
      },
      { threshold: 0.2 },
    )

    const elements = sectionRef.current?.querySelectorAll(".reveal-on-scroll")
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const sectionHeight = rect.height
      const windowHeight = window.innerHeight

      // Sync line to viewport center so reveal feels immediate while scrolling.
      // 0%: first badge reaches center line
      // 100%: last badge reaches center line
      const timelineTopOffset = 60 // matches top-[60px]
      const timelineTravel = Math.max(sectionHeight - 120, 1)
      const viewportTriggerY = windowHeight * 0.5

      const distanceIntoTimeline = viewportTriggerY - (rect.top + timelineTopOffset)
      const progress = Math.max(0, Math.min(100, (distanceIntoTimeline / timelineTravel) * 100))

      // Slight boost so the last node reliably reaches full reveal on typical viewport heights.
      const boostedProgress = Math.min(100, progress * 1.12)
      setLineHeight(boostedProgress)
      ticking = false
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(handleScroll)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    handleScroll() // Call once on mount

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  const getOpacity = (index: number) => {
    const total = principles.length
    const nodeProgress = total <= 1 ? 0 : (index / (total - 1)) * 100

    // Wider fade windows for smoother, more gradual transitions
    // For the last item, end the fade earlier so it reaches full visibility
    const isLast = index === total - 1
    const fadeStart = nodeProgress - 15
    const fadeEnd = isLast ? nodeProgress + 5 : nodeProgress + 15

    if (lineHeight <= fadeStart) return 0
    if (lineHeight >= fadeEnd) return 1

    // Calculate normalized progress through the fade window
    const t = (lineHeight - fadeStart) / (fadeEnd - fadeStart)
    
    // Smoother ease-in-out curve for seamless transitions
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  const getBadgeOpacity = (index: number) => {
    const total = principles.length
    const nodeProgress = total <= 1 ? 0 : (index / (total - 1)) * 100

    // Badge starts invisible and fills as line approaches
    const fadeStart = nodeProgress - 10
    const fadeEnd = nodeProgress + 2

    if (lineHeight <= fadeStart) return 0
    if (lineHeight >= fadeEnd) return 1

    // Quick fade-in as line reaches the badge
    const t = (lineHeight - fadeStart) / (fadeEnd - fadeStart)
    return t * t * (3 - 2 * t) // Smoothstep easing
  }

  const principles = [
    {
      number: "01",
      title: "Performance First",
      description: "Every feature is designed to help you trade better — not just track more. If it doesn't improve your results, it doesn't belong here.",
      align: "right"
    },
    {
      number: "02",
      title: "Clarity Over Complexity",
      description: "Trading is hard enough. Your journal shouldn't be. My Trade Log surfaces what matters so you can act with confidence.",
      align: "left"
    },
    {
      number: "03",
      title: "Know Your Numbers",
      description: "No guesswork. No vague stats. See exactly where you win, where you lose, and what needs fixing.",
      align: "right"
    },
    {
      number: "04",
      title: "Improve Faster",
      description: "Turn every trade into feedback. Identify patterns, eliminate costly habits, and accelerate your path to consistency.",
      align: "left"
    }
  ]

  const renderPrincipleDescription = (principle: { number: string; description: string }) => {
    if (principle.number === "01") {
      return (
        <>
          <span className="text-zinc-400">Every feature is designed to help you trade </span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">better</span>
          <span className="text-zinc-400"> — not just track more. If it doesn&apos;t improve your </span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">results</span>
          <span className="text-zinc-400">, it doesn&apos;t belong here.</span>
        </>
      )
    }

    if (principle.number === "02") {
      return (
        <>
          <span className="text-zinc-400">Trading is hard enough. Your journal shouldn&apos;t be. My Trade Log surfaces what </span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">matters</span>
          <span className="text-zinc-400"> so you can act with </span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">confidence</span>
          <span className="text-zinc-400">.</span>
        </>
      )
    }

    if (principle.number === "03") {
      return (
        <>
          <span className="text-zinc-400">No </span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">guesswork</span>
          <span className="text-zinc-400">. No vague stats. See exactly where you win, where you lose, and what needs </span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">fixing</span>
          <span className="text-zinc-400">.</span>
        </>
      )
    }

    if (principle.number === "04") {
      return (
        <>
          <span className="text-zinc-400">Turn every trade into </span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">feedback</span>
          <span className="text-zinc-400">. Identify patterns, eliminate costly habits, and accelerate your path to </span>
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">consistency</span>
          <span className="text-zinc-400">.</span>
        </>
      )
    }

    return <>{principle.description}</>
  }

  return (
    <section className="py-20 sm:py-28 bg-black scroll-mt-16" id="approach" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Heading Section */}
        <div className="mb-16 sm:mb-20 reveal-on-scroll text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 max-w-4xl mx-auto">
            Our Approach
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-semibold">
            My Trade Log turns your trade history into <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">clear insights</span> so you can <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">eliminate mistakes</span> and build <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">consistent results</span>.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Vertical Line */}
          <div 
            ref={lineRef}
            className="absolute left-1/2 top-[60px] w-0.5 bg-gradient-to-b from-indigo-600 via-purple-500 to-indigo-600 -translate-x-1/2 hidden md:block"
            style={{
              height: `calc((100% - 120px) * ${lineHeight / 100})`
            }}
          ></div>

          {/* Principles */}
          <div className="space-y-16 md:space-y-20">
            {principles.map((principle, index) => (
              <div
                key={index}
                className={`reveal-on-scroll delay-${index * 100} relative`}
              >
                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-2 gap-16 items-center">
                  {principle.align === "right" ? (
                    <>
                      {/* Left side - empty space */}
                      <div></div>
                      {/* Right side - content */}
                      <div className="pl-16">
                        <div className="space-y-4 transition-opacity duration-700 ease-in-out" style={{ opacity: getOpacity(index) }}>
                          <h3 className="text-3xl font-bold text-white">
                            {principle.title}
                          </h3>
                          <p className="text-lg text-zinc-400 leading-relaxed font-semibold">
                            {renderPrincipleDescription(principle)}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Left side - content */}
                      <div className="text-right pr-16">
                        <div className="space-y-4 transition-opacity duration-700 ease-in-out" style={{ opacity: getOpacity(index) }}>
                          <h3 className="text-3xl font-bold text-white">
                            {principle.title}
                          </h3>
                          <p className="text-lg text-zinc-400 leading-relaxed font-semibold">
                            {renderPrincipleDescription(principle)}
                          </p>
                        </div>
                      </div>
                      {/* Right side - empty space */}
                      <div></div>
                    </>
                  )}
                </div>

                {/* Center Badge - Desktop */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block z-10">
                  <div className="relative group">
                    <div className="relative w-20 h-20 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/50 hover:border-indigo-500/40 rounded-3xl flex items-center justify-center shadow-2xl hover:shadow-indigo-500/10 hover:scale-[1.02] transition-all duration-500" style={{ opacity: 1 }}>
                      <span 
                        className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent transition-opacity duration-500"
                        style={{ opacity: getBadgeOpacity(index) }}
                      >
                        {principle.number}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="mb-6">
                    <div className="relative inline-block group">
                      <div className="relative w-16 h-16 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/50 hover:border-indigo-500/40 rounded-3xl flex items-center justify-center shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500" style={{ opacity: 1 }}>
                        <span 
                          className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent transition-opacity duration-500"
                          style={{ opacity: getBadgeOpacity(index) }}
                        >
                          {principle.number}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white transition-opacity duration-700 ease-in-out" style={{ opacity: getOpacity(index) }}>
                      {principle.title}
                    </h3>
                    <p className="text-base sm:text-lg text-zinc-400 leading-relaxed font-semibold transition-opacity duration-700 ease-in-out" style={{ opacity: getOpacity(index) }}>
                      {renderPrincipleDescription(principle)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
