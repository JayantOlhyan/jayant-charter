"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollProviderProps {
  enabled: boolean;
  children: React.ReactNode;
}

/**
 * Centralized desktop smooth-scroll + GSAP ScrollTrigger coordinator (PRD Section 15.5 & 18.2).
 * - Automatically disabled on prefers-reduced-motion: reduce
 * - Automatically disabled on touch / coarse-pointer devices so native mobile scroll is preserved
 * - Cleans up RAF & ScrollTrigger sync cleanly on route unmount
 */
export function SmoothScrollProvider({ enabled, children }: SmoothScrollProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (prefersReduced || !isFinePointer) return;

    const lenis = new Lenis({
      duration: 1.08,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 1,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, [enabled]);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [pathname]);

  return <>{children}</>;
}
