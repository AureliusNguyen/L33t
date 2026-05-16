"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadCore,
  encodeSet,
  encodeGet,
  parseCommand,
  toHexBytes,
  type CoreHandle,
} from "@/lib/wasm/l33t-core";

type RunRecord = {
  command: string;
  bytes: Uint8Array;
  hex: string[];
  segments: Segment[];
  response: string;
  responseColor: string;
};

type Segment = {
  label: string;
  /** Index range in the hex array this label spans, inclusive. */
  start: number;
  end: number;
};

const EXAMPLES = [
  "SET key_1 hello",
  "GET key_1",
  "GET missing",
  "SET name aurelius",
];

export function InteractiveSetup({ active }: { active?: boolean }) {
  const [core, setCore] = useState<CoreHandle | null>(null);
  const [input, setInput] = useState("SET key_1 hello");
  const [record, setRecord] = useState<RunRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const c = await loadCore(65536);
        if (mounted) setCore(c);
      } catch (err) {
        console.error("wasm load failed", err);
        if (mounted) setError(String(err));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function run() {
    if (!core) return;
    const parsed = parseCommand(input);
    if (parsed.op === "error") {
      setError(parsed.message);
      setRecord(null);
      return;
    }
    setError(null);

    let bytes: Uint8Array;
    let segments: Segment[];
    if (parsed.op === "set") {
      bytes = encodeSet(parsed.key, parsed.value);
      const klen = new TextEncoder().encode(parsed.key).length;
      const vlen = new TextEncoder().encode(parsed.value).length;
      segments = [
        { label: "op (SET)", start: 0, end: 0 },
        { label: "key len", start: 1, end: 2 },
        { label: `key "${parsed.key}"`, start: 3, end: 3 + klen - 1 },
        { label: "val len", start: 3 + klen, end: 3 + klen + 1 },
        { label: `value "${parsed.value}"`, start: 3 + klen + 2, end: 3 + klen + 2 + vlen - 1 },
      ];
    } else {
      bytes = encodeGet(parsed.key);
      const klen = new TextEncoder().encode(parsed.key).length;
      segments = [
        { label: "op (GET)", start: 0, end: 0 },
        { label: "key len", start: 1, end: 2 },
        { label: `key "${parsed.key}"`, start: 3, end: 3 + klen - 1 },
      ];
    }

    const hex = toHexBytes(bytes);
    const result = core.execOneOp(bytes);
    const { response, responseColor } = formatResponse(result.response);

    setRecord({
      command: input,
      bytes,
      hex,
      segments,
      response,
      responseColor,
    });
  }

  function loadExample(cmd: string) {
    setInput(cmd);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div
      className={`relative h-full overflow-auto border bg-[var(--color-midnight-2)] p-5 sm:p-6 scanlines transition-colors ${
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
        className="small mono mb-3"
        style={{ color: "var(--color-ink-muted)" }}
      >
        type a command, hit Run, see the wire bytes
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex items-center flex-1 border border-[var(--color-rule)] bg-[var(--color-midnight)] px-3 py-2 focus-within:border-[color:var(--color-cyan)]/40 transition-colors">
          <span
            className="mono-body mr-2 shrink-0"
            style={{ color: "var(--color-ink-muted)" }}
          >
            $
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            disabled={!core}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="mono-body bg-transparent outline-none flex-1 min-w-0"
            style={{ color: "var(--color-ink)" }}
            aria-label="l33t command (SET or GET)"
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!core}
          className="mono-data px-5 py-2 border transition-colors shrink-0"
          style={{
            background: core ? "var(--color-cyan)" : "transparent",
            color: core ? "var(--color-midnight)" : "var(--color-ink-muted)",
            borderColor: core ? "var(--color-cyan)" : "var(--color-rule)",
            cursor: core ? "pointer" : "not-allowed",
            letterSpacing: "0.06em",
          }}
        >
          {core ? "Run" : "..."}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {EXAMPLES.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => loadExample(cmd)}
            className="mono-data text-xs px-2 py-1 border border-[var(--color-rule)] hover:border-[color:var(--color-cyan)]/40 transition-colors"
            style={{ color: "var(--color-ink-muted)" }}
          >
            {cmd}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="mono-body my-3"
          style={{ color: "var(--color-ink-dim)" }}
        >
          ! {error}
        </div>
      )}

      {record && <HexBreakdown record={record} />}

      {!record && !error && (
        <div
          className="mono-body"
          style={{ color: "var(--color-ink-muted)" }}
        >
          click Run to encode the command into the l33t wire format.
        </div>
      )}
    </div>
  );
}

function HexBreakdown({ record }: { record: RunRecord }) {
  const { hex, segments, response, responseColor, bytes } = record;
  return (
    <div className="mt-4">
      <div className="mono-body mb-3 flex flex-wrap gap-x-2 gap-y-1 items-baseline">
        {hex.map((byte, i) => {
          const seg = segments.find((s) => i >= s.start && i <= s.end);
          const isFirstInSeg = seg && i === seg.start;
          const isLastInSeg = seg && i === seg.end;
          const color = colorForSegment(seg?.label ?? "");
          return (
            <span
              key={i}
              style={{
                color,
                paddingLeft: isFirstInSeg ? 0 : 0,
                paddingRight: isLastInSeg ? 6 : 0,
              }}
            >
              {byte}
            </span>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-1">
        {segments.map((seg) => {
          const slice = bytes.slice(seg.start, seg.end + 1);
          const hexSlice = Array.from(slice)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ");
          return (
            <div
              key={seg.label}
              className="mono-data flex items-baseline gap-3 text-xs"
            >
              <span
                style={{
                  color: colorForSegment(seg.label),
                  minWidth: "13ch",
                }}
              >
                {seg.label}
              </span>
              <span
                style={{ color: "var(--color-ink-muted)" }}
                className="break-all"
              >
                {hexSlice}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 mono-body">
        <span style={{ color: "var(--color-ink-muted)" }}>response: </span>
        <span style={{ color: responseColor }}>{response}</span>
        <span
          className="mono-data ml-3"
          style={{ color: "var(--color-ink-muted)" }}
        >
          ({bytes.length} bytes on wire)
        </span>
      </div>
    </div>
  );
}

function colorForSegment(label: string): string {
  if (label.startsWith("op")) return "var(--color-cyan)";
  if (label.endsWith("len")) return "var(--color-ink-dim)";
  return "var(--color-ink)";
}

function formatResponse(kind: "ok" | "value" | "not_found" | "error"): {
  response: string;
  responseColor: string;
} {
  if (kind === "ok") return { response: "OK", responseColor: "var(--color-cyan)" };
  if (kind === "value")
    return { response: "VALUE (found)", responseColor: "var(--color-cyan)" };
  if (kind === "not_found")
    return { response: "NOT_FOUND", responseColor: "var(--color-ink-dim)" };
  return { response: "error parsing", responseColor: "var(--color-ink-dim)" };
}
