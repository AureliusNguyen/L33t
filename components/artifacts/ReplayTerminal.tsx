"use client";

import { useEffect, useRef, useState } from "react";

export type TerminalLine = {
  /** Prompt prefix, e.g., "shado@l33t:~$ ". Empty for output lines. */
  prompt?: string;
  /** Text to type. */
  text: string;
  /** Color override for the text portion (defaults to ink). */
  color?: string;
  /** Delay before typing this line begins (ms). */
  delay?: number;
};

type Props = {
  lines: TerminalLine[];
  /** Characters typed per second. Default 80. */
  speed?: number;
  /** Restart on every mount (used by the dual-column stage when crossfading in). */
  restartKey?: string | number;
};

export function ReplayTerminal({ lines, speed = 80, restartKey }: Props) {
  const [renderedLines, setRenderedLines] = useState<string[]>(() =>
    lines.map(() => "")
  );
  const [activeLine, setActiveLine] = useState(0);
  const startedRef = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    // If restartKey changes we re-run the typing animation from scratch.
    if (startedRef.current === restartKey) return;
    startedRef.current = restartKey;
    setRenderedLines(lines.map(() => ""));
    setActiveLine(0);

    const charMs = 1000 / speed;
    let cancelled = false;

    (async () => {
      for (let i = 0; i < lines.length; i++) {
        if (cancelled) return;
        const line = lines[i];
        if (line.delay) await sleep(line.delay);
        setActiveLine(i);
        if (line.text.length === 0) continue;
        for (let j = 1; j <= line.text.length; j++) {
          if (cancelled) return;
          setRenderedLines((prev) => {
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
  }, [lines, speed, restartKey]);

  return (
    <div className="border border-[var(--color-rule)] bg-[var(--color-midnight-2)] p-5 scanlines h-full overflow-auto">
      <pre className="mono-body whitespace-pre-wrap leading-relaxed">
        {lines.map((line, i) => {
          const typed = renderedLines[i] ?? "";
          const isActive = i === activeLine;
          const isComplete = typed.length === line.text.length;
          return (
            <div key={i}>
              {line.prompt && (
                <span style={{ color: "var(--color-ink-muted)" }}>{line.prompt}</span>
              )}
              <span style={{ color: line.color ?? "var(--color-ink)" }}>{typed}</span>
              {isActive && !isComplete && <span className="cursor">_</span>}
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
