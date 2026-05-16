"use client";

import { ReplayTerminal, type TerminalLine } from "./ReplayTerminal";

const LINES: TerminalLine[] = [
  { prompt: "root@l33t:~$ ", text: "./l33t-server-uring &" },
  { prompt: "", text: "" },
  { prompt: "root@l33t:~$ ", text: "./l33t-benchmark", delay: 300 },
  { prompt: "", text: "" },
  { prompt: "", text: "throughput   36,189 ops/sec", color: "var(--color-cyan)" },
  { prompt: "", text: "avg latency  0.080 ms" },
  { prompt: "", text: "" },
  { prompt: "", text: "# epoll was 36,234. io_uring is 36,189." },
  {
    prompt: "",
    text: "# the network is the wall.",
    color: "var(--color-ink-dim)",
  },
];

export function IoUringNullResult({
  restartKey,
  progress,
  active,
}: {
  restartKey?: string | number;
  progress?: number;
  active?: boolean;
}) {
  return (
    <ReplayTerminal
      lines={LINES}
      speed={95}
      restartKey={restartKey}
      progress={progress}
      active={active}
    />
  );
}
