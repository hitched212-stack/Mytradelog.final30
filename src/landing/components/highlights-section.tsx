"use client"

import { useEffect, useRef } from "react"
import { ImageComparisonSlider } from "@/components/ui/ImageComparisonSlider"
import webDashboard from "../../assets/landing/web-dashboard.png"
import webDashboardLight from "../../assets/landing/web-dashboard-light.png"
import webAnalytics from "../../assets/landing/web-analytics.png"
import webAnalyticsLight from "../../assets/landing/web-analytics-light.png"
import webHistory from "../../assets/landing/web-history.png"
import webHistoryLight from "../../assets/landing/web-history-light.png"

export function HighlightsSection() {
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
    <section className="bg-black pt-20 pb-20 sm:pt-28 sm:pb-28" id="highlights" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-24 sm:mb-32 reveal-on-scroll">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-8">
            Your complete system for trading performance.
          </h2>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed font-bold">
            <span className="text-zinc-400">Track everything that matters so you can trade with </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">clarity</span>
            <span className="text-zinc-400"> and </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">confidence</span>
            <span className="text-zinc-400">.</span>
          </p>
        </div>

        {/* Feature Grid */}
        <div className="space-y-10 sm:space-y-14">
          {/* Feature 1 - Dashboard */}
          <div className="reveal-on-scroll delay-100">
            <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-4 sm:p-6 lg:p-8 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10 items-center">
              <div className="order-1 md:col-span-2">
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Dashboard</h3>
                <p className="text-lg text-zinc-400 leading-relaxed mb-6">
                  Get a complete overview of your trading performance at a glance. Monitor your balance, win rate, profit/loss, and key metrics in real-time.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Real-time performance tracking
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Customizable widgets
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Multi-timeframe insights
                  </li>
                </ul>
              </div>
              <div className="order-2 md:col-span-3">
                <div className="relative">
                  <div className="relative bg-zinc-900 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl">
                    <ImageComparisonSlider
                      beforeImage={webDashboardLight}
                      afterImage={webDashboard}
                      beforeLabel="Light Mode"
                      afterLabel="Dark Mode"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Feature 2 - Goal Setting */}
          <div className="reveal-on-scroll delay-200">
            <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-4 sm:p-6 lg:p-8 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10 items-center">
              <div className="order-1 md:col-span-2">
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Goal Setting</h3>
                <p className="text-lg text-zinc-400 leading-relaxed mb-6">
                  Set ambitious targets and track your progress toward your trading goals. Break down your objectives and celebrate wins along the way.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Daily, weekly, monthly targets
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Progress visualization
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Smart goal recommendations
                  </li>
                </ul>
              </div>
              <div className="order-2 md:col-span-3">
                <div className="relative">
                  <div className="relative bg-zinc-900 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl">
                    <ImageComparisonSlider
                      beforeImage={webAnalyticsLight}
                      afterImage={webAnalytics}
                      beforeLabel="Light Mode"
                      afterLabel="Dark Mode"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Feature 4 - Trade History */}
          <div className="reveal-on-scroll delay-400">
            <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-4 sm:p-6 lg:p-8 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10 items-center">
              <div className="order-1 md:col-span-2">
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Trade History</h3>
                <p className="text-lg text-zinc-400 leading-relaxed mb-6">
                  Maintain a detailed log of all your trades with complete metrics. Analyze patterns, identify weaknesses, and continuously improve.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Complete trade details
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Advanced filtering & search
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Detailed performance analytics
                  </li>
                </ul>
              </div>
              <div className="order-2 md:col-span-3">
                <div className="relative">
                  <div className="relative bg-zinc-900 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl">
                    <ImageComparisonSlider
                      beforeImage={webHistoryLight}
                      afterImage={webHistory}
                      beforeLabel="Light Mode"
                      afterLabel="Dark Mode"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
