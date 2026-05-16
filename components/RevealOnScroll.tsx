"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Bidirectional viewport-triggered reveal. Element fades + translates up
 * when it scrolls into view, fades + translates down when the user scrolls
 * back out. Respects prefers-reduced-motion via the global override in
 * globals.css.
 */
export function RevealOnScroll({
  children,
  delay = 0,
  y = 24,
  amount = 0.3,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  amount?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
