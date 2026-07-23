"use client";

import { useMemo } from "react";
import type { InspectorEvent } from "@/lib/events";

/**
 * The permission story: compares the latest tools/list per persona in ONE
 * log. Only meaningful after a persona switch (the plan's beat 6).
 */
export function CapabilityDiff({ events }: { events: InspectorEvent[] }) {
  const diff = useMemo(() => {
    const byPersona = new Map<string, Set<string>>();
    const order: string[] = [];
    for (const e of events) {
      if (e.type !== "capabilities.listed" || e.primitive !== "tool") continue;
      if (!byPersona.has(e.persona)) order.push(e.persona);
      byPersona.set(e.persona, new Set(e.items.map((i) => i.name)));
    }
    if (order.length < 2) return null;
    const [a, b] = order.slice(-2);
    const setA = byPersona.get(a)!;
    const setB = byPersona.get(b)!;
    return {
      a,
      b,
      countA: setA.size,
      countB: setB.size,
      added: [...setB].filter((n) => !setA.has(n)).sort(),
      removed: [...setA].filter((n) => !setB.has(n)).sort(),
    };
  }, [events]);

  if (!diff) return null;

  return (
    <div className="rounded-md border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
      <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
        Capability diff — {diff.a} ({diff.countA} tools) → {diff.b} ({diff.countB} tools)
      </h3>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        The MCP surface is permission-dependent: Drupal permissions filter tools/list per token.
      </p>
      {diff.added.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {diff.added.map((n) => (
            <span
              key={n}
              className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            >
              + {n}
            </span>
          ))}
        </div>
      )}
      {diff.removed.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {diff.removed.map((n) => (
            <span
              key={n}
              className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs text-red-800 line-through dark:bg-red-950 dark:text-red-300"
            >
              − {n}
            </span>
          ))}
        </div>
      )}
      {diff.added.length === 0 && diff.removed.length === 0 && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">no differences</p>
      )}
    </div>
  );
}
