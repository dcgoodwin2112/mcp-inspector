import type { InspectorEvent, Primitive } from "./events";

/**
 * Render-time grouping of timeline events — the log itself keeps every event.
 * Templates listings fold into the preceding direct-resources card; repeat
 * listings (persona switches) are flagged for collapsed rendering.
 */

export type CapabilitiesListed = Extract<InspectorEvent, { type: "capabilities.listed" }>;

export interface TimelineRow {
  event: InspectorEvent;
  /** Templates listing folded into the preceding direct-resources card. */
  mergedTemplates?: CapabilitiesListed;
  /** Repeat listing of a primitive (persona switch) — rendered collapsed. */
  compact?: boolean;
}

export function groupTimelineRows(events: InspectorEvent[]): TimelineRow[] {
  const seen = new Set<Primitive>();
  const out: TimelineRow[] = [];
  for (const e of events) {
    if (e.type !== "capabilities.listed") {
      out.push({ event: e });
      continue;
    }
    if (e.primitive === "resource" && e.items.some((i) => i.isTemplate)) {
      const prev = out[out.length - 1];
      if (
        prev?.event.type === "capabilities.listed" &&
        prev.event.primitive === "resource" &&
        !prev.mergedTemplates &&
        prev.event.persona === e.persona
      ) {
        prev.mergedTemplates = e;
        continue;
      }
    }
    out.push({ event: e, compact: seen.has(e.primitive) });
    seen.add(e.primitive);
  }
  return out;
}
