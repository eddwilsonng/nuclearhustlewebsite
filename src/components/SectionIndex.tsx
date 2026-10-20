"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface SectionIndexItem {
  id: string;
  label: string;
}

/** Below the sticky site header (h-16) plus this bar, with a little air. */
const ACTIVE_OFFSET = 136;

/**
 * Numbered in-page index that sticks under the site header and marks the
 * section currently being read. Pages using it get matching scroll padding
 * from `[data-section-index]` in globals.css.
 */
export function SectionIndex({ items }: { items: readonly SectionIndexItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = id;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  // On narrow screens the strip scrolls sideways; keep the active item in view.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !activeId) return;
    const link = list.querySelector<HTMLElement>(`[href="#${activeId}"]`);
    if (!link) return;
    const { left, right } = link.getBoundingClientRect();
    const bounds = list.getBoundingClientRect();
    if (left < bounds.left || right > bounds.right) {
      list.scrollLeft += left - bounds.left - 24;
    }
  }, [activeId]);

  return (
    <nav
      aria-label="On this page"
      data-section-index=""
      className="sticky top-16 z-30 border-b border-rule bg-surface/95 backdrop-blur-sm"
    >
      <div className="relative mx-auto max-w-6xl sm:px-6">
        {/* Hints that the strip scrolls sideways on narrow screens. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-surface to-transparent sm:hidden"
        />
        <ol
          ref={listRef}
          className="flex overflow-x-auto px-6 [scrollbar-width:none] sm:grid sm:grid-cols-5 sm:divide-x sm:divide-rule sm:border-x sm:border-rule sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => {
            const active = item.id === activeId;
            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  aria-current={active ? "location" : undefined}
                  className={cn(
                    "relative flex min-h-12 items-center gap-2.5 px-3 font-sans text-sm font-semibold whitespace-nowrap transition-colors duration-150 sm:px-4",
                    active ? "bg-canvas text-ink" : "text-secondary hover:bg-canvas hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      active ? "text-ink" : "text-secondary",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                  <span aria-hidden="true" className="ml-auto hidden pl-2 font-normal text-secondary lg:inline">
                    ↓
                  </span>
                  {active && (
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />
                  )}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
