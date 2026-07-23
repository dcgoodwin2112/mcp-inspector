"use client";

import { useEffect, useRef, useState } from "react";
import type { InspectorEvent } from "@/lib/events";
import { formatClock } from "@/lib/ui";
import { ActorBadge } from "./ActorBadge";
import { EventCard } from "./EventCard";

/**
 * Pure rendering of a list of events — live mode and replay feed the same
 * component. Owns its scroll: auto-follows the tail while pinned to the
 * bottom; scrolling up unpins and shows a "↓ latest" jump pill.
 */
export function Timeline({
  events,
  emptyHint = "No events yet.",
}: {
  events: InspectorEvent[];
  emptyHint?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && atBottom) el.scrollTop = el.scrollHeight;
  }, [events.length, atBottom]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  function jumpToLatest() {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setAtBottom(true);
  }

  return (
    <div className="relative h-full min-h-0">
      <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-400">{emptyHint}</p>
        ) : (
          <ol className="space-y-2 pb-4">
            {events.map((event, i) => {
              const delta = i === 0 ? event.t : event.t - events[i - 1].t;
              return (
                <li key={event.id} className="flex items-start gap-3">
                  <div className="w-16 shrink-0 pt-1.5 text-right">
                    <div className="font-mono text-xs text-zinc-400">
                      {formatClock(event.t)}
                    </div>
                    {delta > 0 && (
                      <div className="font-mono text-[10px] text-zinc-300 dark:text-zinc-600">
                        +{(delta / 1000).toFixed(1)}s
                      </div>
                    )}
                  </div>
                  <div className="w-16 shrink-0 pt-1">
                    <ActorBadge actor={event.actor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <EventCard event={event} />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      {!atBottom && events.length > 0 && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-3 right-4 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white shadow-lg hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          ↓ latest
        </button>
      )}
    </div>
  );
}
