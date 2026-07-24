import { describe, expect, it } from "vitest";
import type { InspectorEvent } from "@/lib/events";
import { specNote } from "@/lib/spec-notes";

function ev(over: Record<string, unknown>): InspectorEvent {
  return over as unknown as InspectorEvent;
}

/** Every semantic timeline card should self-explain. */
const SEMANTIC_TYPES = [
  "session.started",
  "session.ended",
  "mcp.initialized",
  "auth.persona.selected",
  "auth.oauth.step",
  "auth.token.received",
  "tool.call.requested",
  "tool.call.completed",
  "resource.read",
  "resource.attached",
  "resource.detached",
  "prompt.invoked",
  "prompt.expanded",
  "user.message",
  "model.text",
  "context.snapshot",
  "context.updated",
  "error",
];

describe("specNote", () => {
  it("covers every semantic event type with text and a spec link", () => {
    for (const type of SEMANTIC_TYPES) {
      const note = specNote(ev({ type }));
      expect(note?.text, type).toBeTruthy();
      expect(note?.href, type).toMatch(/^https:\/\/modelcontextprotocol\.io\//);
    }
  });

  it("varies the capabilities note by primitive", () => {
    const tool = specNote(ev({ type: "capabilities.listed", primitive: "tool" }));
    const resource = specNote(ev({ type: "capabilities.listed", primitive: "resource" }));
    const prompt = specNote(ev({ type: "capabilities.listed", primitive: "prompt" }));
    expect(tool?.text).toContain("Model-controlled");
    expect(resource?.text).toContain("App-controlled");
    expect(prompt?.text).toContain("User-controlled");
  });

  it("returns nothing for non-card events", () => {
    expect(specNote(ev({ type: "annotation" }))).toBeUndefined();
    expect(specNote(ev({ type: "rpc.request" }))).toBeUndefined();
  });
});
