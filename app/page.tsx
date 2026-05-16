import { Hero } from "@/components/Hero";
import { ReadingProgress } from "@/components/ReadingProgress";
import { DualColumn, type SectionId } from "@/components/DualColumn";
import { ProseSection, CountUp } from "@/components/LeftProse";
import { ReplayTerminal, type TerminalLine } from "@/components/artifacts/ReplayTerminal";
import { ValueSweepChart } from "@/components/artifacts/ValueSweepChart";
import { IoUringNullResult } from "@/components/artifacts/IoUringNullResult";
import { WasmRttSlider } from "@/components/artifacts/WasmRttSlider";

const SETUP_LINES: TerminalLine[] = [
  { prompt: "shado@l33t:~$ ", text: "xxd -c 19 one-set.bin" },
  { prompt: "", text: "" },
  { prompt: "", text: "01 00 05 6b 65 79 5f 31 00 07 76 61 6c 75 65 5f 31" },
  { prompt: "", text: "" },
  { prompt: "", text: "op klen     key       vlen     value", color: "var(--color-ink-muted)" },
  { prompt: "", text: "01 00 05  'key_1'   00 07   'value_1'", color: "var(--color-ink-muted)" },
  { prompt: "", text: "" },
  { prompt: "", text: "# 3 bytes of framing per op. RESP costs 17-23.", color: "var(--color-ink-dim)" },
];

const PYTHON_LINES: TerminalLine[] = [
  { prompt: "shado@l33t:~$ ", text: "./l33t-benchmark.py" },
  { prompt: "", text: "# original python asyncio", color: "var(--color-ink-muted)" },
  { prompt: "", text: "" },
  { prompt: "", text: "throughput   13,420 ops/sec", color: "var(--color-cyan)" },
  { prompt: "", text: "avg latency  0.220 ms" },
];

const UVLOOP_LINES: TerminalLine[] = [
  { prompt: "shado@l33t:~$ ", text: "./l33t-benchmark.py" },
  { prompt: "", text: "# uvloop + tightened bytecode", color: "var(--color-ink-muted)" },
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
          inlineArtifact={<ReplayTerminal lines={SETUP_LINES} />}
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
            per op. l33t spends three. One byte for the opcode, two bytes
            for a big-endian length, then the payload. The receiver is a
            machine. Humans don&apos;t need to read it.
          </p>
          <p className="body" style={{ color: "var(--color-ink-dim)" }}>
            That one decision sets the ceiling on everything else.
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
            Original implementation: vanilla asyncio, dict-backed store,
            one server per port behind a client-side modulo shard. Three
            shards, three benchmark threads, one hundred thousand ops each.
            Sync per op, no pipelining.
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
          inlineArtifact={<WasmRttSlider />}
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
          inlineArtifact={<ValueSweepChart />}
        >
          <p className="body">
            Three Redis instances on the same host, persistence off, native
            <span className="mono"> redis-benchmark</span> client to remove
            the Python overhead from both sides of the comparison. Values at
            8 B, 100 B, 1024 B, 4096 B.
          </p>
          <p className="body">
            They track each other almost exactly. At 8 B, l33t is faster by
            1.6 percent. At 4 KB, Redis is faster by 0.2 percent. Run-to-run
            variance is larger than the gap.
          </p>
          <p className="body" style={{ color: "var(--color-ink-dim)" }}>
            Per-node on loopback, Redis is roughly twice as fast as l33t.
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
          inlineArtifact={<IoUringNullResult />}
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

  const artifacts: Record<SectionId, React.ReactNode> = {
    "setup": <ReplayTerminal lines={SETUP_LINES} />,
    "ceiling-1-python": <ReplayTerminal lines={PYTHON_LINES} />,
    "ceiling-2-uvloop": <ReplayTerminal lines={UVLOOP_LINES} />,
    "ceiling-3-epoll": <WasmRttSlider />,
    "redis-comparison": <ValueSweepChart />,
    "ceiling-4-iouring": <IoUringNullResult />,
  };

  return (
    <main className="min-h-screen">
      <div className="grain" aria-hidden />
      <ReadingProgress />
      <Hero />

      <div className="rule max-w-[1280px] mx-auto my-32 mx-8 sm:mx-16 xl:mx-auto" />

      <DualColumn sections={sections} artifacts={artifacts} />

      <div className="rule max-w-[1280px] mx-auto my-32 mx-8 sm:mx-16 xl:mx-auto" />

      <section className="max-w-[760px] mx-auto px-8 sm:px-16 mb-40">
        <h2 className="display-2 mb-8">What this isn&apos;t.</h2>
        <p className="body mb-5">
          l33t does not persist. It does not replicate. It does not evict.
          It does not authenticate. It does one thing.
        </p>
        <p className="body" style={{ color: "var(--color-ink-dim)" }}>
          The gap between &quot;ties Redis on a benchmark&quot; and
          &quot;replaces Redis&quot; is fifteen years of careful engineering.
          The comparison here is a comparison on one axis. It is honest about
          that.
        </p>
      </section>

      <section className="max-w-[820px] mx-auto px-8 sm:px-16 pb-48 text-center">
        <p
          className="display-2"
          style={{ color: "var(--color-ink-dim)" }}
        >
          Four ceilings. Three rewrites.
          <br />
          The network was always the wall.
        </p>
      </section>
    </main>
  );
}
