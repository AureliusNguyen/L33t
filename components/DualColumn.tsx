"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type SectionId =
  | "setup"
  | "ceiling-1-python"
  | "ceiling-2-uvloop"
  | "ceiling-3-epoll"
  | "redis-comparison"
  | "ceiling-4-iouring";

export type ArtifactProps = {
  /** 0..1 scroll progress through this section. */
  progress: number;
  /** True if this artifact is the currently active one in the sticky stage. */
  active: boolean;
};

type Props = {
  sections: { id: SectionId; node: ReactNode }[];
  /**
   * Per-section artifact renderers. Receive scroll progress + active state
   * so terminals can sync their typing to user scroll.
   */
  artifacts: Record<SectionId, (props: ArtifactProps) => ReactNode>;
};

export function DualColumn({ sections, artifacts }: Props) {
  const [active, setActive] = useState<SectionId>(sections[0].id);
  const progressRef = useRef<Record<SectionId, number>>(
    sections.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {} as Record<SectionId, number>)
  );
  const [, setRerender] = useState(0);

  // Active-section detection
  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => e !== null);
    if (elements.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const closest = visible.reduce((a, b) =>
          Math.abs(a.boundingClientRect.top) <
          Math.abs(b.boundingClientRect.top)
            ? a
            : b
        );
        setActive(closest.target.id as SectionId);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: 0 }
    );
    elements.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [sections]);

  // Scroll-driven progress for the active section
  useEffect(() => {
    let frame = 0;
    function compute() {
      const el = document.getElementById(active);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress goes 0 -> 1 as the section travels from the trigger line
      // (top of viewport + 20%) to the trigger line + section height.
      const triggerOffset = vh * 0.2;
      const scrolledPast = triggerOffset - rect.top;
      const p = Math.max(0, Math.min(1, scrolledPast / rect.height));
      progressRef.current = { ...progressRef.current, [active]: p };
      setRerender((n) => n + 1);
    }
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(compute);
    }
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [active]);

  return (
    <div className="relative max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16">
      <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-12 lg:gap-20">
        <div className="space-y-32 sm:space-y-40 lg:space-y-56">
          {sections.map((s) => (
            <div key={s.id} id={s.id}>
              {s.node}
            </div>
          ))}
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-20 h-[min(78vh,620px)]">
            <ArtifactStage
              active={active}
              artifacts={artifacts}
              progresses={progressRef.current}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ArtifactStage({
  active,
  artifacts,
  progresses,
}: {
  active: SectionId;
  artifacts: Record<SectionId, (props: ArtifactProps) => ReactNode>;
  progresses: Record<SectionId, number>;
}) {
  return (
    <div className="relative h-full">
      {(Object.keys(artifacts) as SectionId[]).map((id) => {
        const isActive = id === active;
        const node = artifacts[id]({
          progress: progresses[id] ?? 0,
          active: isActive,
        });
        return (
          <div
            key={id}
            aria-hidden={!isActive}
            style={{
              position: "absolute",
              inset: 0,
              opacity: isActive ? 1 : 0,
              transform: `translateY(${isActive ? 0 : 8}px)`,
              transition: "opacity 200ms ease-out, transform 200ms ease-out",
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            {node}
          </div>
        );
      })}
    </div>
  );
}
