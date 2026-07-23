"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CapabilityItem, EventLog } from "@/lib/events";
import type { PublicProfile } from "@/lib/profiles";
import { EventLogStore } from "@/lib/store";
import { LiveSession } from "@/lib/live";
import { AgentLoop } from "@/lib/agent";
import { useEventLog } from "@/hooks/useEventLog";
import { isRpcEvent, useRawFrames } from "@/hooks/useRawFrames";
import { AgentChat } from "./AgentChat";
import { ContextInspector } from "./ContextInspector";
import { FramesDrawer } from "./FramesDrawer";
import { CapabilityDiff } from "./CapabilityDiff";
import { CapabilityPanel } from "./CapabilityPanel";
import { ManualCall } from "./ManualCall";
import { ResourceBrowser } from "./ResourceBrowser";
import { Timeline } from "./Timeline";

type Selection =
  | { kind: "tool"; item: CapabilityItem }
  | { kind: "resource"; item: CapabilityItem }
  | null;

interface Echo {
  ok: boolean;
  text: string;
}

/**
 * Split layout: actions in a left rail (own scroll), timeline in a right
 * pane that auto-follows its tail — act and observe without page scrolling.
 * The last action's outcome also echoes inline next to the form.
 */
export function LiveView({
  onReplay,
  present = false,
}: {
  onReplay: (log: EventLog) => void;
  present?: boolean;
}) {
  const storeRef = useRef<EventLogStore | null>(null);
  if (storeRef.current === null) storeRef.current = new EventLogStore();
  const store = storeRef.current;
  const sessionRef = useRef<LiveSession | null>(null);
  if (sessionRef.current === null) sessionRef.current = new LiveSession(store);
  const loopRef = useRef<AgentLoop | null>(null);
  if (loopRef.current === null) loopRef.current = new AgentLoop(sessionRef.current);

  const events = useEventLog(store);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [persona, setPersona] = useState("read-only");
  const [busy, setBusy] = useState(false);
  const [selection, setSelectionState] = useState<Selection>(null);
  const [echo, setEcho] = useState<Echo | null>(null);
  /** Prefill for the agent box's slash-command flow (panel prompt clicks). */
  const [slashPrefill, setSlashPrefill] = useState<{ text: string; nonce: number } | null>(null);
  const [forceName, setForceName] = useState("");
  const [agentWaiting, setAgentWaiting] = useState(false);
  const [rawFrames, toggleRawFrames] = useRawFrames();
  const [contextOpen, setContextOpen] = useState(false);
  const [railWidth, setRailWidth] = useState(420);
  /** Stacked-layout rail height in px; null = the 50% default. */
  const [railHeight, setRailHeight] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const w = Number(localStorage.getItem("inspector.railWidth"));
    if (w >= 300 && w <= 900) setRailWidth(w);
    const h = Number(localStorage.getItem("inspector.railHeight"));
    if (h >= 120) setRailHeight(h);
  }, []);

  function startDrag(e: React.PointerEvent, axis: "x" | "y") {
    e.preventDefault();
    setDragging(true);
    const start = axis === "x" ? e.clientX : e.clientY;
    const startVal =
      axis === "x"
        ? railWidth
        : (railHeight ?? asideRef.current?.getBoundingClientRect().height ?? 300);
    function move(ev: PointerEvent) {
      if (axis === "x") {
        setRailWidth(Math.min(900, Math.max(300, startVal + ev.clientX - start)));
      } else {
        setRailHeight(
          Math.min(window.innerHeight - 200, Math.max(120, startVal + ev.clientY - start)),
        );
      }
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDragging(false);
      if (axis === "x") {
        setRailWidth((w) => {
          localStorage.setItem("inspector.railWidth", String(w));
          return w;
        });
      } else {
        setRailHeight((h) => {
          if (h !== null) localStorage.setItem("inspector.railHeight", String(h));
          return h;
        });
      }
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function setSelection(sel: Selection) {
    setSelectionState(sel);
    setEcho(null);
  }

  useEffect(() => {
    loopRef.current!.onStateChange = () => setAgentWaiting(loopRef.current!.waiting);
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setProfile)
      .catch((err) => setProfileError(String(err)));
  }, []);

  const caps = useMemo(() => {
    const tools: CapabilityItem[] = [];
    const resources: CapabilityItem[] = [];
    const prompts: CapabilityItem[] = [];
    for (const e of events) {
      if (e.type !== "capabilities.listed") continue;
      if (e.primitive === "tool") tools.splice(0, tools.length, ...e.items);
      else if (e.primitive === "prompt") prompts.splice(0, prompts.length, ...e.items);
      else {
        const isTemplates = e.items.some((i) => i.isTemplate);
        const keep = resources.filter((r) => Boolean(r.isTemplate) !== isTemplates);
        resources.splice(0, resources.length, ...keep, ...e.items);
      }
    }
    return { tools, resources, prompts };
  }, [events]);

  const connected = caps.tools.length > 0;
  const timelineEvents = useMemo(() => events.filter((e) => !isRpcEvent(e)), [events]);

  // Attached resources, derived from the log (deduped by uri).
  const attachedList = useMemo(() => {
    const seen = new Map<string, { uri: string; name: string }>();
    for (const e of events) {
      if (e.type === "resource.attached") seen.set(e.uri, { uri: e.uri, name: e.name });
      else if (e.type === "resource.detached") seen.delete(e.uri);
    }
    return [...seen.values()];
  }, [events]);

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  function selectPersona(key: string) {
    setPersona(key);
    if (connected && profile && key !== sessionRef.current!.persona) {
      setSelection(null);
      void run(() => sessionRef.current!.switchPersona(profile, key));
    }
  }

  function connect() {
    if (!profile) return;
    setSelection(null);
    void run(() => sessionRef.current!.connect(profile, persona));
  }

  function firstText(content: Array<{ type: string; text?: string }>): string {
    return content.find((c) => c.type === "text")?.text ?? "no text content";
  }

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col lg:flex-row ${dragging ? "select-none" : ""}`}
      style={
        {
          "--rail-w": `${railWidth}px`,
          "--rail-h": railHeight !== null ? `${railHeight}px` : "50%",
        } as React.CSSProperties
      }
    >
      {/* ---- Left rail: connection, capabilities, actions ---- */}
      <aside
        ref={asideRef}
        className="min-h-0 shrink-0 space-y-3 overflow-y-auto py-3 max-lg:max-h-[var(--rail-h)] lg:w-[var(--rail-w)] lg:pr-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          {profileError && (
            <span className="text-sm text-red-600 dark:text-red-400">
              profile unavailable: {profileError}
            </span>
          )}
          {profile && (
            <>
              <span className="text-sm text-zinc-500">{profile.name}</span>
              <span className="font-mono text-xs text-zinc-400">{profile.mcpUrl}</span>
              <span className="basis-full" />
              {profile.personas.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => selectPersona(p.key)}
                  title={p.scope}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    persona === p.key
                      ? p.key === "editor"
                        ? "bg-orange-600 text-white"
                        : "bg-emerald-600 text-white"
                      : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={connect}
                disabled={busy}
                className="rounded-md bg-zinc-900 px-4 py-1 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {busy && !connected ? "Connecting…" : connected ? "New session" : "Connect"}
              </button>
            </>
          )}
        </div>

        {connected && (
          <>
            <AgentChat
              loop={loopRef.current!}
              busy={busy}
              waiting={agentWaiting}
              onSend={(text) => void run(() => loopRef.current!.send(text))}
              prompts={caps.prompts}
              prefill={slashPrefill}
              onExpandPrompt={(name, args) => sessionRef.current!.invokePrompt(name, args)}
              onSendPrompt={(name, text) =>
                void run(() => loopRef.current!.send(text, "prompt_invocation"))
              }
              completeArg={(promptName, argName, value) =>
                sessionRef.current!.completeArgument(promptName, argName, value)
              }
            />
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Force-call by name:</span>
              <input
                type="text"
                value={forceName}
                onChange={(e) => setForceName(e.target.value)}
                placeholder="update_dataset"
                className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() =>
                  forceName.trim() &&
                  setSelection({ kind: "tool", item: { name: forceName.trim() } })
                }
                className="rounded border border-zinc-300 px-2 py-0.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                open form
              </button>
            </div>

            {selection?.kind === "tool" && (
              <ManualCall
                tool={selection.item}
                busy={busy}
                onCall={(name, args) =>
                  void run(async () => {
                    const out = await sessionRef.current!.callTool(name, args);
                    setEcho(
                      out.isError
                        ? { ok: false, text: `✗ ${firstText(out.content)}` }
                        : {
                            ok: true,
                            text: `✓ ${out.latencyMs ?? "?"} ms — result on the timeline`,
                          },
                    );
                  })
                }
                onClose={() => setSelection(null)}
              />
            )}
            {selection?.kind === "resource" && (
              <ResourceBrowser
                resource={selection.item}
                busy={busy}
                attached={attachedList}
                onPreview={(uri) => sessionRef.current!.readResource(uri)}
                onAttach={(uri, name, previewed) =>
                  void run(async () => {
                    if (previewed) {
                      sessionRef.current!.attachFromRead(uri, name, previewed);
                      setEcho({ ok: true, text: `✓ attached ${uri} — context snapshot on the timeline` });
                      return;
                    }
                    const out = await sessionRef.current!.attachResource(uri, name);
                    setEcho(
                      out
                        ? {
                            ok: true,
                            text: `✓ read ${out.blocks} block(s) in ${out.latencyMs ?? "?"} ms — attached to context`,
                          }
                        : { ok: false, text: "✗ read failed — see timeline" },
                    );
                  })
                }
                onClose={() => setSelection(null)}
              />
            )}
            {echo && (
              <p
                className={`rounded-md px-3 py-2 text-xs ${
                  echo.ok
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                }`}
              >
                {echo.text}
              </p>
            )}

            <CapabilityPanel
              tools={caps.tools}
              resources={caps.resources}
              prompts={caps.prompts}
              onSelectTool={(item) => setSelection({ kind: "tool", item })}
              onSelectResource={(item) => setSelection({ kind: "resource", item })}
              onSelectPrompt={(item) =>
                setSlashPrefill({ text: `/${item.name} `, nonce: Date.now() })
              }
              selected={selection?.item.name}
            />
            <CapabilityDiff events={events} />
          </>
        )}
      </aside>

      {/* ---- Drag handles: resize the rail (double-click resets) ---- */}
      <div
        onPointerDown={(e) => startDrag(e, "x")}
        onDoubleClick={() => {
          setRailWidth(420);
          localStorage.setItem("inspector.railWidth", "420");
        }}
        title="Drag to resize · double-click to reset"
        className={`hidden shrink-0 cursor-col-resize rounded-full lg:block lg:w-1 ${
          dragging ? "bg-cyan-500" : "bg-zinc-200 hover:bg-cyan-400 dark:bg-zinc-800 dark:hover:bg-cyan-600"
        }`}
      />
      <div
        onPointerDown={(e) => startDrag(e, "y")}
        onDoubleClick={() => {
          setRailHeight(null);
          localStorage.removeItem("inspector.railHeight");
        }}
        title="Drag to resize · double-click to reset"
        className={`h-1 w-full shrink-0 cursor-row-resize rounded-full lg:hidden ${
          dragging ? "bg-cyan-500" : "bg-zinc-200 hover:bg-cyan-400 dark:bg-zinc-800 dark:hover:bg-cyan-600"
        }`}
      />

      {/* ---- Right pane: the timeline, always visible ---- */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col border-zinc-200 py-3 dark:border-zinc-800 max-lg:border-t lg:pl-3">
        <div className={`mb-2 flex shrink-0 items-center gap-2 ${present ? "hidden" : ""}`}>
          <h2 className="text-xs font-semibold uppercase text-zinc-400">Timeline</h2>
          <button
            type="button"
            onClick={() => {
              setContextOpen(false);
              toggleRawFrames();
            }}
            title="Show raw JSON-RPC frames"
            className={`rounded-md border px-2 py-0.5 font-mono text-xs ${
              rawFrames
                ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {"{ }"} Raw frames
          </button>
          <button
            type="button"
            onClick={() => {
              setContextOpen((v) => {
                if (!v && rawFrames) toggleRawFrames();
                return !v;
              });
            }}
            title="What the next model call will send"
            className={`rounded-md border px-2 py-0.5 font-mono text-xs ${
              contextOpen
                ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            ⊞ Context
          </button>
          {events.length > 0 && (
            <span className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => onReplay(store.toEventLog())}
                className="rounded-md border border-violet-400 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950"
              >
                ▶ Replay recording
              </button>
              <button
                type="button"
                onClick={() => {
                  const log = store.toEventLog();
                  const blob = new Blob([JSON.stringify(log, null, 2)], {
                    type: "application/json",
                  });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${log.sessionId}.json`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ⬇ Save .json
              </button>
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1">
          <Timeline
            events={timelineEvents}
            emptyHint="Pick a persona and press Connect — the handshake and capability lists will stream in here."
          />
        </div>
        {contextOpen ? (
          <div className="h-72 shrink-0 pt-2">
            <ContextInspector loop={loopRef.current!} session={sessionRef.current!} busy={busy} />
          </div>
        ) : rawFrames ? (
          <div className="h-64 shrink-0 pt-2">
            <FramesDrawer events={events} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
