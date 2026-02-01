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
    <section className="py-16 sm:py-20 bg-black" ref={sectionRef}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="reveal-on-scroll text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 border border-white/10 mb-4">
            <Home className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
            Add to Your Home Screen
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Get instant access without downloading from an app store.
          </p>
        </div>

        <div className="reveal-on-scroll grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* iPhone Instructions */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-white">iPhone</span>
            </div>
            <ol className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-medium text-white shrink-0 mt-0.5">1</span>
                <span>
                  Open in <span className="text-white">Safari</span> and tap the{" "}
                  <Share className="inline w-3.5 h-3.5 text-indigo-400 -mt-0.5" /> share icon
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-medium text-white shrink-0 mt-0.5">2</span>
                <span>
                  Scroll and tap{" "}
                  <span className="inline-flex items-center gap-1 text-white">
                    <Plus className="inline w-3 h-3 text-indigo-400" />
                    Add to Home Screen
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-medium text-white shrink-0 mt-0.5">3</span>
                <span>Tap <span className="text-white">Add</span> to confirm</span>
              </li>
            </ol>
          </div>

          {/* Android Instructions */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5765-6.1185-9.4396"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Android</span>
            </div>
            <ol className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-medium text-white shrink-0 mt-0.5">1</span>
                <span>
                  Open in <span className="text-white">Chrome</span> and tap the{" "}
                  <MoreVertical className="inline w-3.5 h-3.5 text-indigo-400 -mt-0.5" /> menu
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-medium text-white shrink-0 mt-0.5">2</span>
                <span>
                  Tap{" "}
                  <span className="text-white">Add to Home Screen</span> or{" "}
                  <span className="text-white">Install App</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-medium text-white shrink-0 mt-0.5">3</span>
                <span>Tap <span className="text-white">Install</span> to confirm</span>
              </li>
            </ol>
          </div>
        </div>

        <p className="reveal-on-scroll text-center text-xs text-zinc-600 mt-6">
          Works offline and launches like a native app.
        </p>
      </div>
    </section>
  )
}
