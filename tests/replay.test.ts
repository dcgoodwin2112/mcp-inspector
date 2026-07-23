import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventLog, InspectorEvent } from "@/lib/events";
import { MAX_STEP_DELAY_MS, ReplayController } from "@/lib/replay";

/** Minimal event shapes — the controller only reads t, type, pauseOnReplay. */
function ev(over: Record<string, unknown>): InspectorEvent {
  return { type: "user.message", t: 0, ...over } as unknown as InspectorEvent;
}

function makeLog(events: InspectorEvent[]): EventLog {
  return { version: 2, sessionId: "test", recordedAt: "x", events } as EventLog;
}

const isRpc = (e: InspectorEvent) => (e.type as string).startsWith("rpc.");

describe("ReplayController stepping", () => {
  const log = makeLog([
    ev({ t: 0, type: "session.started" }),
    ev({ t: 100, type: "rpc.request" }),
    ev({ t: 150, type: "rpc.response" }),
    ev({ t: 200, type: "user.message" }),
    ev({ t: 300, type: "model.text" }),
  ]);

  it("steps one event at a time without a skip predicate", () => {
    const c = new ReplayController(log);
    c.stepForward();
    expect(c.getState().cursor).toBe(1);
    c.stepForward();
    expect(c.getState().cursor).toBe(2);
  });

  it("steps past skipped events so a step is never a visible no-op", () => {
    const c = new ReplayController(log);
    c.stepForward(isRpc); // reveal session.started
    expect(c.getState().cursor).toBe(1);
    c.stepForward(isRpc); // steps through both rpc frames to user.message
    expect(c.getState().cursor).toBe(4);
  });

  it("steps back past skipped events", () => {
    const c = new ReplayController(log);
    c.seekEnd();
    c.stepBack(isRpc); // 5 → 4, lands on visible user.message
    expect(c.getState().cursor).toBe(4);
    c.stepBack(isRpc); // 4 → 1, skipping the two rpc frames
    expect(c.getState().cursor).toBe(1);
    c.stepBack(isRpc);
    expect(c.getState().cursor).toBe(0);
  });

  it("stepForward at the end is a no-op", () => {
    const c = new ReplayController(log);
    c.seekEnd();
    c.stepForward();
    expect(c.getState().cursor).toBe(5);
  });

  it("restart and seekEnd set the cursor bounds", () => {
    const c = new ReplayController(log);
    c.seekEnd();
    expect(c.getState().cursor).toBe(5);
    expect(c.currentT).toBe(300);
    c.restart();
    expect(c.getState().cursor).toBe(0);
    expect(c.currentT).toBe(0);
  });
});

describe("ReplayController playback", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reveals events on the recorded delta schedule, divided by speed", () => {
    const log = makeLog([
      ev({ t: 0, type: "session.started" }),
      ev({ t: 1000, type: "user.message" }),
      ev({ t: 3000, type: "model.text" }),
    ]);
    const c = new ReplayController(log);
    c.play();
    vi.advanceTimersByTime(0); // first event at t=0
    expect(c.getState().cursor).toBe(1);
    vi.advanceTimersByTime(999);
    expect(c.getState().cursor).toBe(1);
    vi.advanceTimersByTime(1);
    expect(c.getState().cursor).toBe(2);
    vi.advanceTimersByTime(2000); // last event; playback stops at the end
    expect(c.getState().cursor).toBe(3);
    expect(c.getState().playing).toBe(false);
  });

  it("halves delays at 2x speed", () => {
    const log = makeLog([
      ev({ t: 0, type: "session.started" }),
      ev({ t: 1000, type: "user.message" }),
    ]);
    const c = new ReplayController(log);
    c.setSpeed(2);
    c.play();
    vi.advanceTimersByTime(0);
    expect(c.getState().cursor).toBe(1);
    vi.advanceTimersByTime(500);
    expect(c.getState().cursor).toBe(2);
  });

  it("auto-pauses after revealing a pauseOnReplay annotation", () => {
    const log = makeLog([
      ev({ t: 0, type: "session.started" }),
      ev({ t: 10, type: "annotation", text: "beat", pauseOnReplay: true }),
      ev({ t: 20, type: "user.message" }),
    ]);
    const c = new ReplayController(log);
    c.play();
    vi.advanceTimersByTime(10);
    expect(c.getState().cursor).toBe(2);
    expect(c.getState().playing).toBe(false);
    vi.advanceTimersByTime(10_000); // paused — nothing further reveals
    expect(c.getState().cursor).toBe(2);
  });

  it("compresses recorded idle gaps to the step-delay cap", () => {
    const log = makeLog([
      ev({ t: 0, type: "session.started" }),
      ev({ t: 48_000, type: "annotation", text: "next beat" }), // 48s of presenter idle
    ]);
    const c = new ReplayController(log);
    c.play();
    vi.advanceTimersByTime(0);
    expect(c.getState().cursor).toBe(1);
    vi.advanceTimersByTime(MAX_STEP_DELAY_MS - 1);
    expect(c.getState().cursor).toBe(1);
    vi.advanceTimersByTime(1);
    expect(c.getState().cursor).toBe(2);
  });

  it("divides the capped delay by the playback speed", () => {
    const log = makeLog([
      ev({ t: 0, type: "session.started" }),
      ev({ t: 60_000, type: "user.message" }),
    ]);
    const c = new ReplayController(log);
    c.setSpeed(2);
    c.play();
    vi.advanceTimersByTime(0);
    vi.advanceTimersByTime(MAX_STEP_DELAY_MS / 2);
    expect(c.getState().cursor).toBe(2);
  });

  it("play at the end restarts from the beginning", () => {
    const log = makeLog([
      ev({ t: 0, type: "session.started" }),
      ev({ t: 10, type: "user.message" }),
    ]);
    const c = new ReplayController(log);
    c.seekEnd();
    c.play();
    vi.advanceTimersByTime(0);
    expect(c.getState().cursor).toBe(1);
  });
});
