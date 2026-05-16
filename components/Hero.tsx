"use client";

import { motion } from "motion/react";

const TITLE = "L33t KV";
const DEK = "A KV store that beats Redis 6.0";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-24 sm:py-28 max-w-[1280px] mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.95, ease: [0.2, 0.8, 0.2, 1] }}
        className="display-1 max-w-[14ch]"
      >
        {TITLE}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.95, delay: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        className="lede mt-8 max-w-[44ch]"
      >
        {DEK}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
        className="mt-12 sm:mt-14 max-w-[640px]"
      >
        <HeroTerminal />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 1.15 }}
        className="small mono mt-16 sm:mt-20 max-w-[96ch]"
        style={{ color: "var(--color-ink-muted)" }}
      >
        Four iterations and the true bottleneck discovery.
      </motion.p>
    </section>
  );
}

function HeroTerminal() {
  return (
    <div className="border border-[var(--color-rule)] bg-[var(--color-midnight-2)] p-4 sm:p-6 scanlines overflow-x-auto">
      <pre className="mono-body leading-relaxed whitespace-pre">
        <span style={{ color: "var(--color-ink-muted)" }}>root@l33t:~$ </span>
        <span>./bench --servers 3 --ops 300000</span>
        {"\n\n"}
        <span style={{ color: "var(--color-ink-dim)" }}>throughput   </span>
        <span style={{ color: "var(--color-cyan)" }}>36,234 ops/sec</span>
        {"\n"}
        <span style={{ color: "var(--color-ink-dim)" }}>avg latency  0.080 ms</span>
        {"\n"}
        <span style={{ color: "var(--color-ink-dim)" }}>beating redis 6.0 (35,670 ops/sec)</span>
        {"\n\n"}
        <span style={{ color: "var(--color-ink-muted)" }}>root@l33t:~$ </span>
        <span className="cursor">_</span>
      </pre>
    </div>
  );
}
