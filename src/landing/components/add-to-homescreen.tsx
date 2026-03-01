"use client"

import { useEffect, useRef } from "react"
import { Share, MoreVertical, Plus, Home } from "lucide-react"

export function AddToHomeScreen() {
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
    <section className="py-20 sm:py-28 bg-black" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="reveal-on-scroll text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-zinc-800/50 mb-6 shadow-xl shadow-indigo-500/10">
            <Home className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
            Add to Your Home Screen
          </h2>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed font-bold">
            <span className="text-zinc-400">Get instant access without downloading from an app store for </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">faster access</span>
            <span className="text-zinc-400"> and a </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">native app feel</span>
            <span className="text-zinc-400">.</span>
          </p>
        </div>

        <div className="reveal-on-scroll grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* iPhone Instructions */}
          <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-6 sm:p-8 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-[1.02]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 flex items-center justify-center group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500 shadow-lg">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-white">iPhone</span>
                <p className="text-sm text-zinc-500">Safari install flow</p>
              </div>
            </div>

            <ol className="space-y-4 text-base text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 text-xs font-semibold text-white shrink-0 mt-0.5">1</span>
                <span>
                  Open in <span className="text-white">Safari</span> and tap the{" "}
                  <Share className="inline w-4 h-4 text-indigo-400 -mt-0.5" /> share icon
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 text-xs font-semibold text-white shrink-0 mt-0.5">2</span>
                <span>
                  Scroll and tap{" "}
                  <span className="inline-flex items-center gap-1 text-white">
                    <Plus className="inline w-3 h-3 text-indigo-400" />
                    Add to Home Screen
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 text-xs font-semibold text-white shrink-0 mt-0.5">3</span>
                <span>Tap <span className="text-white">Add</span> to confirm</span>
              </li>
            </ol>
          </div>

          {/* Android Instructions */}
          <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-6 sm:p-8 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-[1.02]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 flex items-center justify-center group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500 shadow-lg">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5765-6.1185-9.4396"/>
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-white">Android</span>
                <p className="text-sm text-zinc-500">Chrome install flow</p>
              </div>
            </div>

            <ol className="space-y-4 text-base text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 text-xs font-semibold text-white shrink-0 mt-0.5">1</span>
                <span>
                  Open in <span className="text-white">Chrome</span> and tap the{" "}
                  <MoreVertical className="inline w-4 h-4 text-indigo-400 -mt-0.5" /> menu
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 text-xs font-semibold text-white shrink-0 mt-0.5">2</span>
                <span>
                  Tap{" "}
                  <span className="text-white">Add to Home Screen</span> or{" "}
                  <span className="text-white">Install App</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 text-xs font-semibold text-white shrink-0 mt-0.5">3</span>
                <span>Tap <span className="text-white">Install</span> to confirm</span>
              </li>
            </ol>
          </div>
        </div>

        <div className="reveal-on-scroll mt-8 text-center">
          <p className="inline-flex items-center rounded-full px-4 py-2 text-sm text-zinc-400 border border-zinc-800/60 bg-zinc-950/60">
            Works offline and launches like a native app.
          </p>
        </div>
      </div>
    </section>
  )
}
