"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  term: string;
  explanation: ReactNode;
  code?: string;
};

export function Glossary({ term, explanation, code }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapperRef} className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`show definition of ${term}`}
        className={`cursor-pointer transition-colors align-baseline hover:brightness-110 ${
          open ? "" : "glossary-flow"
        }`}
        style={{
          color: "var(--color-cyan)",
          background: "transparent",
          padding: open ? "0 0 2px 0" : 0,
          borderBottom: open ? "1px solid var(--color-cyan)" : "none",
        }}
      >
        {term}
      </button>
      {open && (
        <span
          role="dialog"
          className="absolute left-0 top-full mt-2 z-30 w-[min(420px,calc(100vw-2rem))] border p-4 text-left normal-case"
          style={{
            background: "var(--color-midnight-2)",
            borderColor:
              "color-mix(in oklab, var(--color-cyan) 30%, transparent)",
            boxShadow:
              "0 0 0 1px rgba(95,217,245,0.18), 0 24px 48px -16px rgba(0,0,0,0.6)",
          }}
        >
          {/* tooltip pointer arrow connecting popover up to the chip.
              SVG so the triangle's vertical position is pixel-exact and
              not subject to font baseline drift. fill matches popover bg,
              stroke matches popover border; the bottom edge is left open
              so it visually merges into the popover top. */}
          <svg
            aria-hidden
            width="14"
            height="7"
            viewBox="0 0 14 7"
            style={{
              position: "absolute",
              top: -7,
              left: 14,
              overflow: "visible",
            }}
          >
            <path
              d="M0 7 L7 0 L14 7"
              fill="var(--color-midnight-2)"
              stroke="color-mix(in oklab, var(--color-cyan) 30%, transparent)"
              strokeWidth="1"
            />
          </svg>
          <span
            className="block small mono mb-3"
            style={{
              color: "var(--color-cyan)",
              letterSpacing: "0.08em",
            }}
          >
            {term}
          </span>
          {code && (
            <pre
              className="mono-data whitespace-pre overflow-x-auto p-3 mb-3 text-xs leading-relaxed border"
              style={{
                background: "var(--color-midnight)",
                borderColor: "var(--color-rule)",
                color: "var(--color-ink)",
              }}
            >
              {code}
            </pre>
          )}
          <span
            className="block body text-sm"
            style={{ color: "var(--color-ink-dim)" }}
          >
            {explanation}
          </span>
        </span>
      )}
    </span>
  );
}
