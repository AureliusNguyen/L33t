"use client";

import { Hero } from "@/components/Hero";
import { ReadingProgress } from "@/components/ReadingProgress";
import { BackgroundLines } from "@/components/BackgroundLines";
import {
  DualColumn,
  type SectionId,
  type ArtifactProps,
} from "@/components/DualColumn";
import { ProseSection, CountUp } from "@/components/LeftProse";
import { ReplayTerminal, type TerminalLine } from "@/components/artifacts/ReplayTerminal";
import { ValueSweepChart } from "@/components/artifacts/ValueSweepChart";
import { IoUringNullResult } from "@/components/artifacts/IoUringNullResult";
import { WasmRttSlider } from "@/components/artifacts/WasmRttSlider";
import { InteractiveSetup } from "@/components/artifacts/InteractiveSetup";
import { InteractiveTradeoffs } from "@/components/InteractiveTradeoffs";
import { RevealOnScroll } from "@/components/RevealOnScroll";

const PYTHON_LINES: TerminalLine[] = [
  { prompt: "root@l33t:~$ ", text: "./l33t-server.py --port 8080 &" },
  { prompt: "root@l33t:~$ ", text: "./l33t-benchmark.py --threads 3 --ops 100000" },
  { prompt: "", text: "" },
  { prompt: "", text: "throughput   13,420 ops/sec", color: "var(--color-cyan)" },
  { prompt: "", text: "avg latency  0.220 ms" },
  { prompt: "", text: "p99 latency  0.480 ms" },
];

const UVLOOP_LINES: TerminalLine[] = [
  { prompt: "root@l33t:~$ ", text: "pip install uvloop" },
  { prompt: "root@l33t:~$ ", text: "./l33t-server.py --loop uvloop --port 8080 &" },
  { prompt: "root@l33t:~$ ", text: "./l33t-benchmark.py --threads 3 --ops 100000" },
  { prompt: "", text: "" },
  { prompt: "", text: "throughput   31,200 ops/sec", color: "var(--color-cyan)" },
  { prompt: "", text: "avg latency  0.094 ms" },
];

export default function Home() {
  const sections: { id: SectionId; node: React.ReactNode }[] = [
    {
      id: "setup",
      node: (
        <ProseSection
          heading="The setup"
          lede="A 19-byte binary instead of human-readable text."
          inlineArtifact={<InteractiveSetup active />}
        >
          <p className="body">
            A key-value store is a brutally simple thing. Two verbs:
            <span className="mono"> SET</span> and <span className="mono">GET</span>.
            The interface is so small that almost all of the cost lives in
            the wire and the network.
          </p>
          <p className="body">
            Most KV stores reach for Redis&apos;s RESP, a human-readable text
            protocol that costs seventeen to twenty-three bytes of framing
            per op. L33t spends three. One byte for the opcode, two bytes
            for a big-endian length, then the payload. The receiver is a
            machine. Humans don&apos;t need to read it.
          </p>
          <p className="body" style={{ color: "var(--color-ink-dim)" }}>
            Try it. The panel on the right runs your command through the
            same WASM-compiled parser the server uses. Click Run and watch
            it break the bytes apart.
          </p>
        </ProseSection>
      ),
    },
    {
      id: "ceiling-1-python",
      node: (
        <ProseSection
          number="01"
          heading="Python asyncio"
          lede="The reference baseline. Whatever you do next, you compare against this."
          inlineArtifact={<ReplayTerminal lines={PYTHON_LINES} />}
        >
          <p className="body">
            Vanilla asyncio, dict-backed store, one server per port behind
            a client-side modulo shard. Three shards, three benchmark
            threads, one hundred thousand ops each. Sync per op, no
            pipelining. The numbers come back honest.
          </p>
          <p className="body">
            Result: <CountUp value={13420} suffix="ops/sec" />.
          </p>
          <p className="body" style={{ color: "var(--color-ink-dim)" }}>
            Everything that follows is an argument about where the missing
            throughput went.
          </p>
        </ProseSection>
      ),
    },
    {
      id: "ceiling-2-uvloop",
      node: (
        <ProseSection
          number="02"
          heading="uvloop + tightened Python"
          lede="Swap the event loop. Cache the struct. Local-bind the hot-path globals."
          inlineArtifact={<ReplayTerminal lines={UVLOOP_LINES} />}
        >
          <p className="body">
            uvloop replaces asyncio&apos;s event loop with libuv. The wire
            format stays the same; the loop dispatches faster. Then the
            tightening: cache the <span className="mono">struct.Struct</span>,
            use <span className="mono">readexactly</span> instead of a
            hand-rolled read loop, local-bind the hot-path globals so the
            bytecode emits <span className="mono">LOAD_FAST</span> instead
            of <span className="mono">LOAD_GLOBAL</span>.
          </p>
          <p className="body">
            Result: <CountUp value={31200} suffix="ops/sec" />. A 2.3x lift
            without leaving Python.
          </p>
          <p className="body" style={{ color: "var(--color-ink-dim)" }}>
            Most of the gain was the loop. Some of it was the bytecode.
            None of it was rethinking the design.
          </p>
        </ProseSection>
      ),
    },
    {
      id: "ceiling-3-epoll",
      node: (
        <ProseSection
          number="03"
          heading="C epoll"
          lede="Hand-written hashtable. Edge-triggered epoll, drain to EAGAIN. No allocator surprises."
          inlineArtifact={<WasmRttSlider active />}
        >
          <p className="body">
            About four hundred lines of C. FNV-1a hash, open addressing
            with linear probing, tombstones for deletes. Per-connection
            read and write buffers. Edge-triggered epoll, drain everything
            until <span className="mono">EAGAIN</span>.
            <span className="mono"> TCP_NODELAY</span> on the listening
            socket so the kernel doesn&apos;t hold packets waiting for
            payload.
          </p>
          <p className="body">
            Result: <CountUp value={36234} suffix="ops/sec" />.
          </p>
          <p className="body" style={{ color: "var(--color-ink-dim)" }}>
            From here on, tightening server code does almost nothing. The
            bottleneck has moved off-chip. Drag the slider on the right.
            The throughput number is computed from real CPU cost measured
            in a WASM build of the same hashtable, plus whatever RTT you
            dial in. Watch what dominates as you change just the network.
          </p>
        </ProseSection>
      ),
    },
    {
      id: "redis-comparison",
      node: (
        <ProseSection
          number="04"
          heading="The comparison: Redis 6.0"
          lede="Same lab, same wire, same workload shape. Different protocol, different server."
          inlineArtifact={<ValueSweepChart active />}
        >
          <p className="body">
            Three Redis instances on the same host, persistence off, native
            <span className="mono"> redis-benchmark</span> client to remove
            the Python overhead from both sides of the comparison. Values at
            8 B, 100 B, 1024 B, 4096 B.
          </p>
          <p className="body">
            They track each other almost exactly. At 8 B, L33t KV is faster
            by 1.6 percent. At 4 KB, Redis is faster by 0.2 percent.
            Run-to-run variance is larger than the gap.
          </p>
          <p className="body" style={{ color: "var(--color-ink-dim)" }}>
            Per-node on loopback, Redis is roughly twice as fast as L33t KV.
            That gap is what fifteen years of allocator and string work
            buys. On the LAN, the network absorbs it.
          </p>
        </ProseSection>
      ),
    },
    {
      id: "ceiling-4-iouring",
      node: (
        <ProseSection
          number="05"
          heading="io_uring"
          lede="The fancy thing that gave nothing."
          inlineArtifact={<IoUringNullResult active />}
        >
          <p className="body">
            Same hashtable, same protocol. Replace epoll with io_uring. Try
            SQPOLL. Try larger ring sizes. The number does not move.
          </p>
          <p className="body">
            Why: the workload is synchronous per op, in-flight depth is
            around three, there is no batching to amortize. io_uring&apos;s
            whole pitch is amortizing syscall cost across many in-flight
            ops. We don&apos;t have many in-flight ops.
          </p>
          <p className="body" style={{ color: "var(--color-ink-dim)" }}>
            Knowing when not to use the fancy thing is the lesson. The
            bottleneck moved off-chip three ceilings ago. The CPU has
            nothing left to give.
          </p>
        </ProseSection>
      ),
    },
  ];

  // Renderer functions: receive scroll progress + active state per section.
  // Terminals use progress to drive their typing; chart/slider use active to
  // drive the border glow.
  const artifacts: Record<SectionId, (p: ArtifactProps) => React.ReactNode> = {
    "setup": (p) => <InteractiveSetup active={p.active} />,
    "ceiling-1-python": (p) => <ReplayTerminal lines={PYTHON_LINES} progress={p.progress} active={p.active} />,
    "ceiling-2-uvloop": (p) => <ReplayTerminal lines={UVLOOP_LINES} progress={p.progress} active={p.active} />,
    "ceiling-3-epoll": (p) => <WasmRttSlider active={p.active} />,
    "redis-comparison": (p) => <ValueSweepChart active={p.active} />,
    "ceiling-4-iouring": (p) => <IoUringNullResult progress={p.progress} active={p.active} />,
  };

  return (
    <main className="relative min-h-screen">
      <BackgroundLines />
      <div className="grain" aria-hidden />
      <ReadingProgress />

      <div className="relative" style={{ zIndex: 2 }}>
        <Hero />

        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16">
          <div className="rule my-20 sm:my-28 lg:my-32" />
        </div>

        <DualColumn sections={sections} artifacts={artifacts} />

        <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16">
          <div className="rule my-20 sm:my-28 lg:my-32" />
        </div>

        <section className="max-w-[940px] mx-auto px-6 sm:px-12 lg:px-16 mb-28 sm:mb-40">
          <h2
            className="display-2 mb-8"
            style={{ textWrap: "balance" }}
          >
            We beat Redis... But at what cost?
          </h2>
          <p className="body mb-6 max-w-[760px]">
            36,234 ops/sec to Redis 6.0&apos;s 35,670. A 1.6 percent edge
            that vanishes the moment you ask L33t KV to do anything Redis
            was actually built to do. Here is what got cut to claim those
            numbers.
          </p>

          <h3 className="h2 mt-14 mb-4">What you give up to get the speed.</h3>

          <InteractiveTradeoffs />

          <RevealOnScroll>
            <h3 className="h2 mt-16 mb-6">What this taught me.</h3>
          </RevealOnScroll>

          <div className="space-y-6">
            <RevealOnScroll>
              <p className="body">
                <em className="lede" style={{ fontSize: "1em", color: "var(--color-ink)" }}>
                  The wire protocol matters less than you would think.
                </em>{" "}
                RESP costs five to seven times the framing per op that our
                three-byte format does. At the LAN-RTT ceiling that
                difference disappears. The win you can measure isn&apos;t
                always the win that matters.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.05}>
              <p className="body">
                <em className="lede" style={{ fontSize: "1em", color: "var(--color-ink)" }}>
                  CPU is rarely the bottleneck once a real network is in
                  the loop.
                </em>{" "}
                Three rewrites moved the server from thirteen thousand ops
                per second to thirty-six thousand. At five microsec of CPU
                per op against eighty microsec of LAN RTT, anything you do
                to the CPU side is shaving margins on a number that&apos;s
                already small.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
              <p className="body">
                <em className="lede" style={{ fontSize: "1em", color: "var(--color-ink)" }}>
                  Knowing when to stop optimizing is harder than starting.
                </em>{" "}
                io_uring gave nothing because there were no in-flight ops
                to amortize. The correct response to a fancy tool that
                doesn&apos;t help is to put it down, not to keep tuning
                parameters until something moves.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.15}>
              <p className="body" style={{ color: "var(--color-ink-dim)" }}>
                <em className="lede" style={{ fontSize: "1em", color: "inherit" }}>
                  Fifteen years of operational hardening beats one weekend
                  of micro-optimization.
                </em>{" "}
                Features you don&apos;t have are only valuable if you
                don&apos;t need them. The day L33t KV needs to survive a
                process restart is the day it stops being a benchmark and
                starts being a database, and that is a different project.
              </p>
            </RevealOnScroll>
          </div>
        </section>

        <section className="max-w-[1040px] mx-auto px-6 sm:px-12 lg:px-16 pb-32 sm:pb-48 text-center">
          <p
            className="display-2"
            style={{ color: "var(--color-ink)", textWrap: "balance" }}
          >
            L33t KV.
            <br />
            A database that beat Redis 6.0 by 1.6 percent
            <br />
            <span style={{ color: "var(--color-ink-dim)" }}>
              by sacrificing everything Redis spent fifteen years building.
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}

