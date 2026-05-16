"use client";

import { useEffect, useState, type ReactNode } from "react";

export type SectionId =
  | "setup"
  | "ceiling-1-python"
  | "ceiling-2-uvloop"
  | "ceiling-3-epoll"
  | "redis-comparison"
  | "ceiling-4-iouring";

type Props = {
  sections: { id: SectionId; node: ReactNode }[];
  artifacts: Record<SectionId, ReactNode>;
};

export function DualColumn({ sections, artifacts }: Props) {
  const [active, setActive] = useState<SectionId>(sections[0].id);

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => e !== null);
    if (elements.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        // Closest to the upper-middle of the viewport
        const closest = visible.reduce((a, b) =>
          Math.abs(a.boundingClientRect.top) < Math.abs(b.boundingClientRect.top)
            ? a
            : b
        );
        setActive(closest.target.id as SectionId);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 }
    );
    elements.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [sections]);

  return (
    <div className="relative max-w-[1280px] mx-auto px-8 sm:px-16">
      <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-16 lg:gap-24">
        <div className="space-y-40 lg:space-y-56">
          {sections.map((s) => (
            <div key={s.id} id={s.id}>
              {s.node}
            </div>
          ))}
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24 h-[520px]">
            <ArtifactStage active={active} artifacts={artifacts} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ArtifactStage({
  active,
  artifacts,
}: {
  active: SectionId;
  artifacts: Record<SectionId, ReactNode>;
}) {
  return (
    <div className="relative h-full">
      {Object.entries(artifacts).map(([id, node]) => {
        const isActive = id === active;
        return (
          <div
            key={id}
            aria-hidden={!isActive}
            style={{
              position: "absolute",
              inset: 0,
              opacity: isActive ? 1 : 0,
              transform: `translateY(${isActive ? 0 : 8}px)`,
              transition: "opacity 180ms ease-out, transform 180ms ease-out",
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
