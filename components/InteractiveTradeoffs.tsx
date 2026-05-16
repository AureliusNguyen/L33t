"use client";

import { motion, useInView } from "motion/react";
import { useMemo, useRef, useState } from "react";

type Feature = {
  id: string;
  title: string;
  description: string;
  redis: string;
};

const FEATURES: Feature[] = [
  {
    id: "persistence",
    title: "Persistence",
    description:
      "Survive a process crash without losing your data. The store rebuilds from disk on restart.",
    redis: "Redis: AOF logs + RDB snapshots",
  },
  {
    id: "replication",
    title: "Replication",
    description:
      "Run primaries with read replicas and promote a follower automatically when the primary dies.",
    redis: "Redis: primary/replica + Sentinel + Cluster",
  },
  {
    id: "eviction",
    title: "Eviction under memory pressure",
    description:
      "Enforce a memory cap. When you hit it, drop old or rarely-used keys instead of refusing writes.",
    redis: "Redis: LRU, LFU, allkeys-lru, volatile-ttl",
  },
  {
    id: "auth",
    title: "Auth and TLS",
    description:
      "Refuse unauthenticated connections. Encrypt the wire so untrusted networks can't read or modify ops.",
    redis: "Redis: ACLs + TLS + per-user permissions",
  },
  {
    id: "observability",
    title: "Observability",
    description:
      "See latency percentiles, hit ratios, slow queries, eviction counts. Trace a slow request after the fact.",
    redis: "Redis: INFO, SLOWLOG, MONITOR, LATENCY",
  },
  {
    id: "types",
    title: "Data types beyond bytes",
    description:
      "Hashes, lists, sets, sorted sets, streams, hyperloglogs, geo, bitmaps. Operations richer than get-and-set.",
    redis: "Redis: 9+ first-class data structures",
  },
  {
    id: "tooling",
    title: "Everything else operations needs",
    description:
      "Expiration / TTL, pub/sub, Lua scripting, multi-key transactions, cluster mode, client tracking.",
    redis: "Redis: 15 years of operational surface",
  },
];

export function InteractiveTradeoffs() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const count = selected.size;
  const verdict = useMemo(() => {
    if (count === 0) {
      return {
        label: "l33t works for you",
        color: "var(--color-cyan)",
        sub: "Your workload fits the demo. SET, GET, restart-and-lose-everything is acceptable.",
      };
    }
    if (count <= 2) {
      return {
        label: "you need a real KV store",
        color: "var(--color-ink)",
        sub: `${count} of 7 features missing. l33t is the wrong tool here.`,
      };
    }
    return {
      label: "you need Redis (or a replacement)",
      color: "var(--color-ink)",
      sub: `${count} of 7 features missing. The gap between l33t and a real database is the gap between a benchmark and a production service.`,
    };
  }, [count]);

  return (
    <div ref={ref} className="mt-4">
      <div
        className="small mono mb-6"
        style={{ color: "var(--color-ink-muted)" }}
      >
        check each feature you would need in production. the verdict updates live.
      </div>

      <div className="space-y-3">
        {FEATURES.map((f, i) => {
          const isOn = selected.has(f.id);
          return (
            <motion.button
              key={f.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 * i, ease: "easeOut" }}
              onClick={() => toggle(f.id)}
              aria-pressed={isOn}
              className="w-full text-left group focus:outline-none"
            >
              <div
                className="grid grid-cols-[28px_1fr] sm:grid-cols-[28px_180px_1fr] gap-x-4 gap-y-1 items-start border-t border-[var(--color-rule)] py-4 transition-colors"
                style={{
                  borderTopColor: isOn
                    ? "var(--color-cyan)"
                    : "var(--color-rule)",
                }}
              >
                <Checkbox checked={isOn} />
                <div
                  className="mono-data uppercase tracking-wider"
                  style={{
                    color: isOn ? "var(--color-cyan)" : "var(--color-ink)",
                    letterSpacing: "0.08em",
                    transition: "color 200ms ease-out",
                  }}
                >
                  {f.title}
                </div>
                <div className="col-start-2 sm:col-start-3 sm:row-start-1">
                  <p
                    className="body"
                    style={{ color: "var(--color-ink-dim)" }}
                  >
                    {f.description}
                  </p>
                  <motion.div
                    initial={false}
                    animate={{
                      height: isOn ? "auto" : 0,
                      opacity: isOn ? 1 : 0,
                      marginTop: isOn ? 6 : 0,
                    }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <p
                      className="small mono"
                      style={{ color: "var(--color-cyan)" }}
                    >
                      {f.redis} <span style={{ color: "var(--color-ink-muted)" }}>/ l33t: none</span>
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        layout
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mt-8 border border-[var(--color-rule)] bg-[var(--color-midnight-2)] p-5 sm:p-6"
        style={{
          borderColor: count === 0 ? "var(--color-cyan)" : "var(--color-rule)",
          transition: "border-color 240ms ease-out",
        }}
      >
        <div className="flex items-baseline justify-between gap-4">
          <div
            className="small mono"
            style={{ color: "var(--color-ink-muted)" }}
          >
            features you need
          </div>
          <div
            className="mono-data tabular-nums"
            style={{ color: "var(--color-cyan)" }}
          >
            {count} / {FEATURES.length}
          </div>
        </div>
        <div
          className="display-2 mt-3"
          style={{
            color: verdict.color,
            transition: "color 240ms ease-out",
          }}
        >
          {verdict.label}.
        </div>
        <div
          className="body mt-3"
          style={{ color: "var(--color-ink-dim)" }}
        >
          {verdict.sub}
        </div>
      </motion.div>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className="relative h-5 w-5 mt-[2px] shrink-0 border transition-colors"
      style={{
        borderColor: checked ? "var(--color-cyan)" : "var(--color-rule)",
        background: checked ? "var(--color-cyan)" : "transparent",
      }}
    >
      <motion.svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
        style={{ position: "absolute", inset: 0 }}
        initial={false}
        animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <path
          d="M4 10.5 L8.5 14.5 L16 6"
          stroke="var(--color-midnight)"
          strokeWidth="2.6"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </motion.svg>
    </div>
  );
}
