"use client";

/**
 * Atmospheric SVG layer: dim cyan electro lines that sweep horizontally
 * (oscilloscope-style) and a few vertical pulse strands. Pure CSS animation,
 * pointer-events: none, fixed full-bleed, respects prefers-reduced-motion
 * via the global rule in globals.css.
 */
export function BackgroundLines() {
  return (
    <div
      aria-hidden
      className="bg-lines"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sweep" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--color-cyan)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--color-cyan)" stopOpacity="0.5" />
            <stop offset="1" stopColor="var(--color-cyan)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pulseV" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-cyan)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--color-cyan)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--color-cyan)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sweeping horizontal lines at varied y positions and speeds */}
        <g opacity="0.5">
          <rect
            className="sweep sweep-1"
            x="-800"
            y="180"
            width="800"
            height="1"
            fill="url(#sweep)"
          />
          <rect
            className="sweep sweep-2"
            x="-1000"
            y="430"
            width="1000"
            height="1"
            fill="url(#sweep)"
          />
          <rect
            className="sweep sweep-3"
            x="-600"
            y="680"
            width="600"
            height="1"
            fill="url(#sweep)"
          />
        </g>

        {/* Vertical pulse strands - low opacity ambient */}
        <g opacity="0.35">
          <rect
            className="pulse-v pulse-v-1"
            x="240"
            y="-100"
            width="1"
            height="200"
            fill="url(#pulseV)"
          />
          <rect
            className="pulse-v pulse-v-2"
            x="780"
            y="-100"
            width="1"
            height="200"
            fill="url(#pulseV)"
          />
          <rect
            className="pulse-v pulse-v-3"
            x="1320"
            y="-100"
            width="1"
            height="200"
            fill="url(#pulseV)"
          />
        </g>

        {/* Static grid hairlines - low contrast structural background */}
        <g stroke="var(--color-cyan)" strokeWidth="0.5" opacity="0.04">
          <line x1="0" y1="225" x2="1600" y2="225" />
          <line x1="0" y1="450" x2="1600" y2="450" />
          <line x1="0" y1="675" x2="1600" y2="675" />
          <line x1="400" y1="0" x2="400" y2="900" />
          <line x1="800" y1="0" x2="800" y2="900" />
          <line x1="1200" y1="0" x2="1200" y2="900" />
        </g>
      </svg>
    </div>
  );
}
