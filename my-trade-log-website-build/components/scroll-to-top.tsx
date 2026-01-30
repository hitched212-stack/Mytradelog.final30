"use client"

import { useEffect, useCallback } from "react"
import { useLocation } from "react-router-dom"

/**
 * Global component that handles:
 * 1. Scrolling to top on page load/refresh
 * 2. Resetting all scroll-triggered animations
 * 3. Re-initializing IntersectionObserver for animations
 * 
 * This component is placed in the root layout for global effect.
 * It works with both hard refreshes and client-side navigation.
 * Applies to all viewports: mobile, tablet, and desktop.
 */
export function ScrollToTop() {
  const location = useLocation()

  // Reset all reveal-on-scroll animations by removing is-visible class
  const resetAnimations = useCallback(() => {
    const animatedElements = document.querySelectorAll(".reveal-on-scroll")
    animatedElements.forEach((el) => {
      el.classList.remove("is-visible")
    })
  }, [])

  // Re-observe all animated elements to trigger animations when scrolled into view
  const setupIntersectionObserver = useCallback(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
          }
        })
      },
      { threshold: 0.1 }
    )

    // Small delay to ensure DOM is ready and animations are reset
    requestAnimationFrame(() => {
      const elements = document.querySelectorAll(".reveal-on-scroll")
      elements.forEach((el) => observer.observe(el))
    })

    return observer
  }, [])

  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }

    // Immediately scroll to top (works on all devices)
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })

    // Reset all animations first
    resetAnimations()

    // Setup observer to re-trigger animations as user scrolls
    const observer = setupIntersectionObserver()

    // Handle beforeunload to prepare for refresh
    const handleBeforeUnload = () => {
      resetAnimations()
    }

    // Handle visibility change (for mobile browser tab switches)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Page became visible again, ensure we're at top
        window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      observer.disconnect()
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [location.pathname, location.hash, resetAnimations, setupIntersectionObserver])

  return null
}
