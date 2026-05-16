"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type TerminalLine = {
  /** Prompt prefix, e.g., "shado@l33t:~$ ". Empty for output lines. */
  prompt?: string;
  /** Text to type. */
  text: string;
  /** Color override for the text portion (defaults to ink). */
  color?: string;
  /** Delay before typing this line begins (ms). Only used in auto-type mode. */
  delay?: number;
};

type Props = {
  lines: TerminalLine[];
  /** Characters typed per second when auto-typing. */
  speed?: number;
  /** Restart key for auto-type mode (changes re-run the animation). */
  restartKey?: string | number;
  /**
   * 0..1 scroll-driven progress. When provided, the terminal renders chars
   * proportional to progress instead of auto-typing on mount.
   */
  progress?: number;
  /** True if this terminal is the currently active artifact (drives glow). */
  active?: boolean;
};

export function ReplayTerminal({
  lines,
  speed = 80,
  restartKey,
  progress,
  active,
}: Props) {
  const totalChars = useMemo(
    () => lines.reduce((sum, l) => sum + l.text.length, 0),
    [lines]
  );
  const isScrollDriven = progress !== undefined;

  // Auto-type mode state
  const [autoRendered, setAutoRendered] = useState<string[]>(() =>
    lines.map(() => "")
  );
  const [autoActiveLine, setAutoActiveLine] = useState(0);
  const startedRef = useRef<string | number | undefined>(undefined);

  // Auto-type effect (only runs when not scroll-driven)
  useEffect(() => {
    if (isScrollDriven) return;
    if (startedRef.current === restartKey) return;
    startedRef.current = restartKey;
    setAutoRendered(lines.map(() => ""));
    setAutoActiveLine(0);

    const charMs = 1000 / speed;
    let cancelled = false;

    (async () => {
      for (let i = 0; i < lines.length; i++) {
        if (cancelled) return;
        const line = lines[i];
        if (line.delay) await sleep(line.delay);
        setAutoActiveLine(i);
        if (line.text.length === 0) continue;
        for (let j = 1; j <= line.text.length; j++) {
          if (cancelled) return;
          setAutoRendered((prev) => {
            const next = [...prev];
            next[i] = line.text.slice(0, j);
            return next;
          });
          await sleep(charMs);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lines, speed, restartKey, isScrollDriven]);

  // Compute rendered lines for scroll-driven mode
  const { renderedLines, activeLine, isCursorOn } = useMemo(() => {
    if (!isScrollDriven) {
      return {
        renderedLines: autoRendered,
        activeLine: autoActiveLine,
        isCursorOn: true,
      };
    }
    const charsToShow = Math.floor(totalChars * (progress ?? 0));
    let remaining = charsToShow;
    const next: string[] = [];
    let activeIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      const len = lines[i].text.length;
      if (remaining <= 0) {
        next.push("");
        continue;
      }
      if (remaining >= len) {
        next.push(lines[i].text);
        remaining -= len;
        activeIdx = i;
      } else {
        next.push(lines[i].text.slice(0, remaining));
        activeIdx = i;
        remaining = 0;
      }
    }
    return {
      renderedLines: next,
      activeLine: activeIdx,
      isCursorOn: charsToShow > 0 && charsToShow < totalChars,
    };
  }, [
    isScrollDriven,
    progress,
    totalChars,
    lines,
    autoRendered,
    autoActiveLine,
  ]);

  return (
    <div
      className={`relative h-full overflow-auto border bg-[var(--color-midnight-2)] p-5 scanlines transition-colors ${
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
      {/* Active trace - thin cyan line at the top edge that fades in when active */}
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

      <pre className="mono-body whitespace-pre-wrap leading-relaxed">
        {lines.map((line, i) => {
          const typed = renderedLines[i] ?? "";
          const isLineActive = i === activeLine;
          const isLineComplete = typed.length === line.text.length;
          const showCursor =
            isLineActive && (!isLineComplete || (isScrollDriven && isCursorOn));
          return (
            <div key={i}>
              {line.prompt && (
                <span style={{ color: "var(--color-ink-muted)" }}>
                  {line.prompt}
                </span>
              )}
              <span style={{ color: line.color ?? "var(--color-ink)" }}>
                {typed}
              </span>
              {showCursor && <span className="cursor">_</span>}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
