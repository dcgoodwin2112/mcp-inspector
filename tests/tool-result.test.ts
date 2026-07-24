import { describe, expect, it } from "vitest";
import type { InspectorEvent } from "@/lib/events";
import { specNote } from "@/lib/spec-notes";
import { inBandError } from "@/lib/tool-result";

function ev(over: Record<string, unknown>): InspectorEvent {
  return over as unknown as InspectorEvent;
}

describe("inBandError", () => {
  it("detects DKAN's structured error payloads", () => {
    expect(
      inBandError({ isError: false, structuredContent: { error: "Dataset not found: x" } }),
    ).toBe("Dataset not found: x");
  });

  it("ignores successful results and non-string error fields", () => {
    expect(inBandError({ structuredContent: { results: [] } })).toBeUndefined();
    expect(inBandError({ structuredContent: { error: { code: 1 } } })).toBeUndefined();
    expect(inBandError(undefined)).toBeUndefined();
    expect(inBandError("text")).toBeUndefined();
  });
});

describe("error-channel notes", () => {
  it("labels tool-result failures as channel 1 (isError or in-band)", () => {
    const flagged = specNote(
      ev({ type: "tool.call.completed", isError: true, result: {} }),
    );
    const inBand = specNote(
      ev({
        type: "tool.call.completed",
        isError: false,
        result: { structuredContent: { error: "boom" } },
      }),
    );
    const ok = specNote(ev({ type: "tool.call.completed", isError: false, result: {} }));
    expect(flagged?.text).toContain("channel 1");
    expect(inBand?.text).toContain("channel 1");
    expect(ok?.text).not.toContain("channel 1");
  });

  it("labels protocol errors channel 2 and transport failures channel 3", () => {
    expect(specNote(ev({ type: "error", scope: "rpc", message: "m" }))?.text).toContain(
      "channel 2",
    );
    expect(specNote(ev({ type: "error", scope: "auth", message: "m" }))?.text).toContain(
      "channel 2",
    );
    expect(specNote(ev({ type: "error", scope: "transport", message: "m" }))?.text).toContain(
      "channel 3",
    );
  });
});
