"use client";

import { motion, useScroll, useSpring } from "motion/react";

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        left: 24,
        top: 0,
        width: 1,
        height: "100vh",
        background: "var(--color-cyan)",
        transformOrigin: "top",
        scaleY,
        zIndex: 40,
      }}
    />
  );
}
