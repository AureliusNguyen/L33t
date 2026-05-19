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
        className="inline-flex items-center gap-1 px-1.5 py-[1px] border cursor-pointer transition-colors align-baseline"
        style={{
          borderColor: open
            ? "var(--color-cyan)"
            : "color-mix(in oklab, var(--color-cyan) 55%, transparent)",
          background: open
            ? "color-mix(in oklab, var(--color-cyan) 12%, transparent)"
            : "color-mix(in oklab, var(--color-cyan) 6%, transparent)",
          color: open ? "var(--color-cyan)" : "inherit",
          borderRadius: 2,
        }}
      >
        <span>{term}</span>
        <span
          aria-hidden
          className="mono-data"
          style={{
            fontSize: "0.7em",
            color: "var(--color-cyan)",
            opacity: 0.85,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 180ms ease-out",
            display: "inline-block",
            lineHeight: 1,
          }}
        >
          v
        </span>
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
