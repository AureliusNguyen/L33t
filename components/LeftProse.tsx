"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function ProseSection({
  number,
  heading,
  lede,
  children,
  inlineArtifact,
}: {
  number?: string;
  heading: string;
  lede?: string;
  children: ReactNode;
  inlineArtifact?: ReactNode;
}) {
  return (
    <section className="relative">
      {number && (
        <span
          aria-hidden
          className="numeric-anchor absolute select-none"
          style={{ left: -32, top: -120 }}
        >
          {number}
        </span>
      )}
      <h2 className="display-2 relative">{heading}</h2>
      {lede && <p className="lede mt-4 relative">{lede}</p>}
      <div className="mt-8 space-y-6 relative">{children}</div>
      {inlineArtifact && (
        <div className="mt-10 lg:hidden h-[clamp(440px,72vh,620px)]">
          {inlineArtifact}
        </div>
      )}
    </section>
  );
}

export function CountUp({
  value,
  suffix,
  duration = 1200,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    const start = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // cubic-out
      setDisplay(Math.round(value * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="mono-data tabular-nums">
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4 }}
        style={{ color: "var(--color-cyan)" }}
      >
        {display.toLocaleString()}
      </motion.span>
      {suffix && (
        <span style={{ color: "var(--color-ink-muted)" }}> {suffix}</span>
      )}
    </span>
  );
}
