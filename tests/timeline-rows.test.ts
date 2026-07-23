import { describe, expect, it } from "vitest";
import type { InspectorEvent } from "@/lib/events";
import { groupTimelineRows } from "@/lib/timeline-rows";

/** Minimal shapes — grouping reads type, primitive, persona, items. */
function cap(over: Record<string, unknown>): InspectorEvent {
  return {
    type: "capabilities.listed",
    primitive: "tool",
    persona: "read-only",
    items: [{ name: "t1" }],
    ...over,
  } as unknown as InspectorEvent;
}

function other(type = "user.message"): InspectorEvent {
  return { type } as unknown as InspectorEvent;
}

const direct = { items: [{ name: "dkan://catalog" }] };
const templates = { items: [{ name: "dkan://dataset/{id}", isTemplate: true }] };

describe("groupTimelineRows", () => {
  it("passes non-capability events through 1:1", () => {
    const rows = groupTimelineRows([other("session.started"), other()]);
    expect(rows).toHaveLength(2);
    expect(rows[0].mergedTemplates).toBeUndefined();
    expect(rows[0].compact).toBeUndefined();
  });

  it("folds a templates listing into the preceding direct-resources row", () => {
    const rows = groupTimelineRows([
      cap({}),
      cap({ primitive: "resource", ...direct }),
      cap({ primitive: "resource", ...templates }),
      cap({ primitive: "prompt" }),
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[1].mergedTemplates?.items[0].isTemplate).toBe(true);
  });

  it("does not merge across personas", () => {
    const rows = groupTimelineRows([
      cap({ primitive: "resource", ...direct }),
      cap({ primitive: "resource", persona: "editor", ...templates }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].mergedTemplates).toBeUndefined();
  });

  it("gives a templates listing its own row when nothing precedes it", () => {
    const rows = groupTimelineRows([cap({ primitive: "resource", ...templates })]);
    expect(rows).toHaveLength(1);
    expect(rows[0].compact).toBe(false);
  });

  it("marks repeat listings compact per primitive (persona switch)", () => {
    const rows = groupTimelineRows([
      cap({}),
      cap({ primitive: "resource", ...direct }),
      cap({ primitive: "resource", ...templates }),
      cap({ primitive: "prompt" }),
      other(),
      cap({ persona: "editor" }),
      cap({ primitive: "resource", persona: "editor", ...direct }),
      cap({ primitive: "resource", persona: "editor", ...templates }),
      cap({ primitive: "prompt", persona: "editor" }),
    ]);
    const caps = rows.filter((r) => r.event.type === "capabilities.listed");
    expect(caps.map((r) => r.compact)).toEqual([false, false, false, true, true, true]);
    // the editor resources pair merged too
    expect(caps[4].mergedTemplates).toBeDefined();
  });
});
