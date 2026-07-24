import type { InspectorEvent } from "@/lib/events";
import { meterPoints } from "@/lib/context-meter";

/**
 * Context growth per model call: one stacked bar per snapshot (system /
 * conversation / tool definitions), scaled to the largest call. Tool
 * definitions are the flat baseline every call pays; the conversation is
 * what grows — the visual argument for context management.
 */

const SEGMENTS = [
  { key: "tools" as const, label: "tool defs", cls: "bg-cyan-600 dark:bg-cyan-500" },
  { key: "system" as const, label: "system", cls: "bg-indigo-500 dark:bg-indigo-400" },
  { key: "messages" as const, label: "conversation", cls: "bg-fuchsia-600 dark:bg-fuchsia-500" },
];

const BAR_MAX_PX = 56;

export function ContextMeter({ events }: { events: InspectorEvent[] }) {
  const points = meterPoints(events);
  if (points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.total));
  const last = points[points.length - 1];
  return (
    <div className="rounded border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">
          context per model call
        </span>
        <span className="ml-auto font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
          last ~{Math.round(last.total / 4).toLocaleString()} tok · {points.length} call
          {points.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-1 flex items-end gap-1" style={{ height: BAR_MAX_PX }}>
        {points.map((p, i) => (
          <div
            key={i}
            title={`${p.turnId} · ~${Math.round(p.total / 4).toLocaleString()} tok (system ${Math.round(p.system / 4)}, conversation ${Math.round(p.messages / 4)}, tool defs ${Math.round(p.tools / 4)})`}
            className="flex w-4 flex-col justify-end overflow-hidden rounded-sm"
            style={{ height: `${Math.max(6, (p.total / max) * BAR_MAX_PX)}px` }}
          >
            {/* Top-down render order: conversation, system, tools (baseline). */}
            {[...SEGMENTS].reverse().map((s) => (
              <div key={s.key} className={s.cls} style={{ height: `${(p[s.key] / p.total) * 100}%` }} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-3">
        {SEGMENTS.map((s) => (
          <span key={s.key} className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className={`size-2 rounded-sm ${s.cls}`} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
