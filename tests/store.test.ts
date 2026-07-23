import { describe, expect, it } from "vitest";
import { EventLogSchema } from "@/lib/events";
import { EventLogStore } from "@/lib/store";

const SESSION_STARTED = {
  type: "session.started",
  profile: "Test",
  serverUrl: "https://example.test/mcp",
  transport: "streamable-http",
  mode: "live",
};

describe("EventLogStore.append", () => {
  it("assigns the envelope: gapless seq from 1, t=0 anchor, session id", () => {
    const store = new EventLogStore();
    store.start("sess-1");
    const first = store.append("app", SESSION_STARTED);
    expect(first.seq).toBe(1);
    expect(first.t).toBe(0);
    expect(first.sessionId).toBe("sess-1");
    expect(first.id).toMatch(/^evt-001-/);

    const second = store.append("user", { type: "annotation", text: "hi" });
    expect(second.seq).toBe(2);
    expect(second.t).toBeGreaterThanOrEqual(0);
    expect(store.getEvents()).toHaveLength(2);
  });

  it("rejects malformed events at write time and appends nothing", () => {
    const store = new EventLogStore();
    store.start("sess-1");
    store.append("app", SESSION_STARTED);
    expect(() => store.append("app", { type: "no.such.event" })).toThrow();
    // tokenPreview must be the REDACTED literal — a real token never enters the log
    expect(() =>
      store.append("server", {
        type: "auth.token.received",
        scopes: ["dkan_mcp:read"],
        expiresAt: new Date().toISOString(),
        tokenPreview: "Bearer eyJhbGci...",
      }),
    ).toThrow();
    expect(store.getEvents()).toHaveLength(1);
  });

  it("produces a log that satisfies the full EventLogSchema", () => {
    const store = new EventLogStore();
    store.start("sess-1");
    store.append("app", SESSION_STARTED);
    store.append("server", {
      type: "auth.token.received",
      scopes: ["dkan_mcp:read"],
      expiresAt: new Date().toISOString(),
      tokenPreview: "REDACTED",
    });
    const log = store.toEventLog();
    expect(log.version).toBe(2);
    expect(() => EventLogSchema.parse(log)).not.toThrow();
  });

  it("start() resets for a new session", () => {
    const store = new EventLogStore();
    store.start("a");
    store.append("app", SESSION_STARTED);
    store.start("b");
    expect(store.getEvents()).toHaveLength(0);
    const e = store.append("app", SESSION_STARTED);
    expect(e.seq).toBe(1);
    expect(e.sessionId).toBe("b");
  });
});
