import type { InspectorEvent } from "./events";

/**
 * Data for the context-growth meter: one point per model call, from
 * context.snapshot events that carry payload sizes (`chars`). Older
 * recordings without sizes simply contribute no points.
 */

export interface MeterPoint {
  turnId: string;
  system: number;
  messages: number;
  tools: number;
  total: number;
}

export function meterPoints(events: InspectorEvent[]): MeterPoint[] {
  const points: MeterPoint[] = [];
  for (const e of events) {
    if (e.type !== "context.snapshot" || !e.chars) continue;
    const { system, messages, tools } = e.chars;
    points.push({ turnId: e.turnId, system, messages, tools, total: system + messages + tools });
  }
  return points;
}
