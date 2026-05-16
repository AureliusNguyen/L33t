"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

type Row = { size: string; l33t: number; redis: number };

const DATA: Row[] = [
  { size: "8 B", l33t: 36234, redis: 35670 },
  { size: "100 B", l33t: 35966, redis: 35277 },
  { size: "1024 B", l33t: 32046, redis: 31812 },
  { size: "4096 B", l33t: 24384, redis: 24428 },
];

const MAX = 40000;

export function ValueSweepChart({ active }: { active?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  return (
    <div
      ref={ref}
      className={`relative h-full overflow-auto border bg-[var(--color-midnight-2)] p-6 transition-colors ${
        active
          ? "border-[color:var(--color-cyan)]/40"
          : "border-[var(--color-rule)]"
      }`}
      style={{
        boxShadow: active
          ? "0 0 0 1px rgba(95,217,245,0.18), 0 0 48px -16px rgba(95,217,245,0.35)"
          : "none",
        transition: "box-shadow 240ms ease-out, border-color 240ms ease-out",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, var(--color-cyan), transparent)",
          opacity: active ? 0.8 : 0,
          transition: "opacity 320ms ease-out",
        }}
      />
      <div
        className="small mono mb-5"
        style={{ color: "var(--color-ink-muted)" }}
      >
        throughput by value size (ops/sec, higher is better)
      </div>
      <div className="space-y-5">
        {DATA.map((row, i) => (
          <div key={row.size}>
            <div className="flex justify-between mb-2">
              <span className="mono-data">{row.size}</span>
              <span
                className="mono-data"
                style={{ color: "var(--color-ink-muted)" }}
              >
                l33t {row.l33t.toLocaleString()} / redis {row.redis.toLocaleString()}
              </span>
            </div>
            <div className="relative h-2 bg-[var(--color-rule)]">
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${(row.l33t / MAX) * 100}%` } : {}}
                transition={{ duration: 0.95, ease: "easeOut", delay: i * 0.06 }}
                style={{ background: "var(--color-cyan)", height: "100%" }}
              />
            </div>
            <div className="relative h-2 bg-[var(--color-rule)] mt-1">
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${(row.redis / MAX) * 100}%` } : {}}
                transition={{
                  duration: 0.95,
                  ease: "easeOut",
                  delay: 0.1 + i * 0.06,
                }}
                style={{ background: "var(--color-cyan-dim)", height: "100%" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        className="small mono mt-6"
        style={{ color: "var(--color-ink-muted)" }}
      >
        cyan = l33t-server-epoll. dim = redis 6.0 native bench.
        <br />
        3-node, LAN cross-machine, sync per op.
      </div>
    </div>
  );
}
