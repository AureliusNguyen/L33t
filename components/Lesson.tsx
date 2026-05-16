"use client";

import type { ReactNode } from "react";

/**
 * Card for a single lesson in the "What this taught me" section.
 * - Italicized headline + body live as separate visible elements.
 * - On hover: left border thickens + turns cyan, headline shifts to
 *   cyan, body color brightens from ink-dim to ink.
 * - Pure CSS hover (group/group-hover) so it's interruptible and
 *   touch-friendly (touch devices show the brighter resting state
 *   if Tailwind's hover semantics don't fire).
 */
export function Lesson({
  headline,
  children,
}: {
  headline: string;
  children: ReactNode;
}) {
  return (
    <div className="group relative pl-6 py-3 cursor-default">
      <span
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-px bg-[var(--color-rule)] group-hover:bg-[color:var(--color-cyan)] group-hover:w-[2px] transition-all duration-300"
      />
      <div
        className="lede mb-2 text-[color:var(--color-ink)] group-hover:text-[color:var(--color-cyan)] transition-colors duration-300"
        style={{ fontSize: "1em" }}
      >
        {headline}
      </div>
      <div className="body text-[color:var(--color-ink-dim)] group-hover:text-[color:var(--color-ink)] transition-colors duration-300">
        {children}
      </div>
    </div>
  );
}
