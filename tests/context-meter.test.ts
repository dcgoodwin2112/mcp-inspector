import { describe, expect, it } from "vitest";
import type { InspectorEvent } from "@/lib/events";
import { meterPoints } from "@/lib/context-meter";

function ev(over: Record<string, unknown>): InspectorEvent {
  return over as unknown as InspectorEvent;
}

describe("meterPoints", () => {
  it("emits one point per sized snapshot, in order", () => {
    const points = meterPoints([
      ev({ type: "user.message", text: "x" }),
      ev({
        type: "context.snapshot",
        turnId: "turn-1",
        blocks: [],
        chars: { system: 100, messages: 50, tools: 2000 },
      }),
      ev({
        type: "context.snapshot",
        turnId: "turn-1",
        blocks: [],
        chars: { system: 100, messages: 900, tools: 2000 },
      }),
    ]);
    expect(points).toHaveLength(2);
    expect(points[0]).toEqual({ turnId: "turn-1", system: 100, messages: 50, tools: 2000, total: 2150 });
    expect(points[1].total).toBe(3000);
  });

  it("skips snapshots without sizes (older recordings)", () => {
    const points = meterPoints([
      ev({ type: "context.snapshot", turnId: "preview", blocks: [] }),
    ]);
    expect(points).toEqual([]);
  });
});
