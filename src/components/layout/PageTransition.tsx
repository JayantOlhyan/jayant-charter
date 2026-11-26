"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth Jesko-inspired route entrance transition (Barba-style slide-fade parity)
 * with ScrollTrigger refresh and reduced-motion bypass.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const firstMountRef = useRef(true);

  useEffect(() => {
    if (firstMountRef.current) {
      firstMountRef.current = false;
      return;
    }

    const el = ref.current;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (el && !prefersReduced) {
      gsap.fromTo(
        el,
        { opacity: 0.01 },
        {
          opacity: 1,
          duration: 0.45,
          ease: "power2.out",
          clearProps: "opacity",
          onComplete: () => {
            ScrollTrigger.refresh();
          },
        }
      );
    } else {
      ScrollTrigger.refresh();
    }
  }, [pathname]);

  return (
    <div ref={ref} className="flex flex-1 flex-col">
      {children}
    </div>
  );
}
