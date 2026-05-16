"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadCore,
  encodeSet,
  encodeGet,
  type CoreHandle,
} from "@/lib/wasm/l33t-core";

const CLIENTS = 3;
const VALUE_SIZE_BYTES = 8;
const LINK_GBIT = 1; // 1 Gbit assumed link speed

export function WasmRttSlider() {
  const [core, setCore] = useState<CoreHandle | null>(null);
  const [cpuUs, setCpuUs] = useState<number | null>(null);
  const [rttMs, setRttMs] = useState(80);
  const [pulse, setPulse] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const c = await loadCore(65536);
        if (!mounted) return;
        const measured = measureCpu(c);
        setCore(c);
        setCpuUs(measured);
      } catch (err) {
        console.error("wasm load failed", err);
        if (mounted) setLoadError(String(err));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const bandwidthUs = useMemo(() => {
    // bandwidth time in us = bytes * 8 / (Gbit * 1000) microseconds
    const bytesPerOp = 3 + 8 + 2 + VALUE_SIZE_BYTES + 1; // request + ack
    return (bytesPerOp * 8) / (LINK_GBIT * 1000);
  }, []);

  const rttUs = rttMs * 1000;
  const totalUs = (cpuUs ?? 5) + bandwidthUs + rttUs;
  const throughput = Math.round((CLIENTS / totalUs) * 1e6);
  const bottleneck = pickBottleneck(cpuUs ?? 5, bandwidthUs, rttUs);

  function onRttChange(v: number) {
    setRttMs(v);
    setPulse(true);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulse(false), 180);
  }

  return (
    <div className="border border-[var(--color-rule)] bg-[var(--color-midnight-2)] p-6 h-full overflow-auto">
      <div
        className="small mono mb-2"
        style={{ color: "var(--color-ink-muted)" }}
      >
        drag the RTT - watch what dominates
      </div>

      <div className="my-6">
        <div
          className="flex justify-between small mono"
          style={{ color: "var(--color-ink-muted)" }}
        >
          <span>RTT 0 ms</span>
          <span>200 ms</span>
        </div>
        <input
          type="range"
          min={0}
          max={200}
          step={1}
          value={rttMs}
          onChange={(e) => onRttChange(Number(e.target.value))}
          className="w-full mt-1"
          style={{ accentColor: "var(--color-cyan)" }}
          aria-label="Round-trip time in milliseconds"
        />
        <div
          className="mono-data mt-1 text-center"
          style={{ color: "var(--color-cyan)" }}
        >
          {rttMs} ms
        </div>
      </div>

      <div className="my-8">
        <div
          className="small mono mb-2"
          style={{ color: "var(--color-ink-muted)" }}
        >
          estimated throughput
        </div>
        <div
          className="display-2 tabular-nums"
          style={{
            color: pulse ? "var(--color-cyan)" : "var(--color-ink)",
            transition: "color 180ms ease-out",
            fontVariationSettings: "\"opsz\" 144",
          }}
        >
          {core && cpuUs !== null ? throughput.toLocaleString() : "----"}
          <span
            className="mono-data ml-3"
            style={{ color: "var(--color-ink-muted)" }}
          >
            ops/sec
          </span>
        </div>
      </div>

      <table className="w-full mono-data mt-6">
        <tbody>
          <Row
            label="cpu work"
            value={cpuUs !== null ? `${cpuUs.toFixed(2)} microsec` : "(loading)"}
            note="measured live in WASM"
          />
          <Row
            label="bandwidth"
            value={`${bandwidthUs.toFixed(2)} microsec`}
            note={`derived from ${VALUE_SIZE_BYTES} B value at ${LINK_GBIT} Gbit`}
          />
          <Row
            label="network RTT"
            value={`${(rttUs / 1000).toFixed(0)} microsec`}
            note="you control this"
          />
        </tbody>
      </table>

      <div className="mt-6 small mono">
        <span style={{ color: "var(--color-ink-muted)" }}>bottleneck: </span>
        <span style={{ color: "var(--color-cyan)" }}>{bottleneck}</span>
      </div>

      {loadError && (
        <div
          className="small mono mt-4"
          style={{ color: "var(--color-ink-muted)" }}
        >
          (failed to load wasm core: {loadError})
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <tr>
      <td className="py-1" style={{ color: "var(--color-ink-muted)" }}>
        {label}
      </td>
      <td className="py-1 text-right">{value}</td>
      <td
        className="py-1 pl-4 small"
        style={{ color: "var(--color-ink-muted)" }}
      >
        {note}
      </td>
    </tr>
  );
}

function pickBottleneck(cpu: number, bw: number, rtt: number): string {
  const max = Math.max(cpu, bw, rtt);
  if (max === rtt) return "network";
  if (max === bw) return "bandwidth";
  return "cpu";
}

function measureCpu(core: CoreHandle): number {
  // Warm + 1000 ops, take median microseconds-per-op.
  const set = encodeSet("key_1", "value_1");
  const get = encodeGet("key_1");
  for (let i = 0; i < 200; i++) {
    core.benchOneOp(i % 2 === 0 ? set : get);
  }
  const samples: number[] = [];
  for (let i = 0; i < 1000; i++) {
    const ns = core.benchOneOp(i % 2 === 0 ? set : get);
    samples.push(ns / 1000);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}
