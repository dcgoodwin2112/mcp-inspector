import { describe, expect, it } from "vitest";
import type { InspectorEvent } from "@/lib/events";
import { diagramRows } from "@/lib/sequence";

function ev(over: Record<string, unknown>): InspectorEvent {
  return { id: "e1", ...over } as unknown as InspectorEvent;
}

describe("diagramRows", () => {
  it("renders initialize as a request/response arrow pair", () => {
    const rows = diagramRows([
      ev({ type: "mcp.initialized", serverInfo: { name: "s", version: "1" } }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ kind: "arrow", from: "app", to: "server", label: "initialize" });
    expect(rows[1]).toMatchObject({ kind: "arrow", from: "server", to: "app", dashed: true });
  });

  it("distinguishes model-driven from manual tool calls", () => {
    const model = diagramRows([
      ev({ type: "tool.call.requested", toolName: "search_datasets", args: {}, turnId: "turn-1" }),
    ]);
    expect(model[0]).toMatchObject({ from: "model", to: "app", label: "tool_use search_datasets" });
    expect(model[1]).toMatchObject({ from: "app", to: "server" });

    const manual = diagramRows([
      ev({ type: "tool.call.requested", toolName: "search_datasets", args: {} }),
    ]);
    expect(manual[0]).toMatchObject({ from: "user", to: "app", label: "call search_datasets" });
  });

  it("labels the model call with tool and attachment counts", () => {
    const rows = diagramRows([
      ev({
        type: "context.snapshot",
        turnId: "turn-1",
        blocks: [
          { kind: "system", summary: "s" },
          { kind: "tool_definitions", count: 25, names: [] },
          { kind: "attached_resource", uri: "dkan://x", name: "x" },
        ],
      }),
    ]);
    expect(rows[0]).toMatchObject({ from: "app", to: "model", label: "context: 25 tools · 1 attached" });
  });

  it("marks tool errors and rpc errors with the error tone", () => {
    const rows = diagramRows([
      ev({ type: "tool.call.completed", toolName: "t", latencyMs: 5, isError: true, result: {} }),
      ev({ id: "e2", type: "error", scope: "rpc", code: -32002, message: "forbidden" }),
    ]);
    expect(rows[0]).toMatchObject({ tone: "error", from: "server" });
    expect(rows[1]).toMatchObject({ tone: "error", label: "-32002 forbidden" });
  });

  it("skips raw rpc frames and banners annotations", () => {
    const rows = diagramRows([
      ev({ type: "rpc.request", raw: {} }),
      ev({ id: "e2", type: "annotation", text: "Beat 1" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "banner", label: "Beat 1" });
  });

  it("chooses the right list method per primitive", () => {
    const rows = diagramRows([
      ev({ type: "capabilities.listed", primitive: "resource", persona: "p", items: [{ name: "u", isTemplate: true }] }),
    ]);
    expect(rows[0]).toMatchObject({ label: "resources/templates/list" });
    expect(rows[1]).toMatchObject({ label: "1 resources", dashed: true });
  });
});
