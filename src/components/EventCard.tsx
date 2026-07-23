import type { InspectorEvent, Primitive } from "@/lib/events";
import { PRIMITIVE_STYLES } from "@/lib/ui";
import { Markdown } from "./Markdown";

function Json({ data }: { data: unknown }) {
  // Long escaped-JSON strings render as one huge line — wrap them and cap the
  // block's height with its own scrollbar so everything stays reachable.
  return (
    <pre className="mt-1 max-h-72 overflow-y-auto whitespace-pre-wrap break-all rounded bg-zinc-100 p-2 font-mono text-xs leading-relaxed dark:bg-zinc-900">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Raw({ summary, data }: { summary: string; data: unknown }) {
  return (
    <details className="mt-1">
      <summary className="cursor-pointer select-none text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
        {summary}
      </summary>
      <Json data={data} />
    </details>
  );
}

function PrimitiveTag({ primitive }: { primitive: Primitive }) {
  const s = PRIMITIVE_STYLES[primitive];
  return <span className={`text-xs font-semibold uppercase ${s.text}`}>{s.label}</span>;
}

function Card({
  primitive,
  tone,
  children,
}: {
  primitive?: Primitive;
  tone?: "error" | "system";
  children: React.ReactNode;
}) {
  const border = primitive ? `border-l-2 ${PRIMITIVE_STYLES[primitive].border}` : "";
  const toneCls =
    tone === "error"
      ? "border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
      : tone === "system"
        ? "bg-zinc-50 dark:bg-zinc-900/60"
        : "bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800";
  return <div className={`rounded-md px-3 py-2 text-sm ${toneCls} ${border}`}>{children}</div>;
}

function HttpStatus({ status }: { status: number }) {
  const ok = status >= 200 && status < 300;
  return (
    <span
      className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${
        ok
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      HTTP {status}
    </span>
  );
}

export function EventCard({ event }: { event: InspectorEvent }) {
  switch (event.type) {
    case "session.started":
      return (
        <Card tone="system">
          <span className="font-medium">Session started</span> — profile{" "}
          <span className="font-medium">{event.profile}</span>{" "}
          <span className="font-mono text-xs text-zinc-500">{event.serverUrl}</span>{" "}
          <span className="text-xs text-zinc-500">
            ({event.transport}, {event.mode})
          </span>
        </Card>
      );

    case "session.ended":
      return (
        <Card tone="system">
          <span className="font-medium">Session ended</span>{" "}
          <span className="text-xs text-zinc-500">({event.reason})</span>
        </Card>
      );

    case "mcp.initialized":
      return (
        <Card tone="system">
          <span className="font-medium">MCP initialized</span> — {event.serverInfo.name} v
          {event.serverInfo.version}
          {event.mcpSessionId && (
            <span className="ml-2 font-mono text-xs text-zinc-500">{event.mcpSessionId}</span>
          )}
          <Raw summary="capabilities" data={event.capabilities} />
        </Card>
      );

    case "auth.persona.selected":
      return (
        <Card tone="system">
          Persona selected: <span className="font-medium">{event.label}</span>
        </Card>
      );

    case "auth.oauth.step":
      return (
        <Card tone="system">
          OAuth <span className="font-mono text-xs">{event.step}</span>
          {event.detail && <span className="ml-2 text-xs text-zinc-500">{event.detail}</span>}
        </Card>
      );

    case "auth.token.received":
      return (
        <Card tone="system">
          Token received — scopes{" "}
          <span className="font-mono text-xs">{event.scopes.join(", ")}</span>
          <span className="ml-2 text-xs text-zinc-500">
            expires {new Date(event.expiresAt).toLocaleTimeString()}
          </span>
          <span className="ml-2 rounded bg-zinc-200 px-1 font-mono text-xs dark:bg-zinc-700">
            {event.tokenPreview}
          </span>
        </Card>
      );

    case "capabilities.listed": {
      const s = PRIMITIVE_STYLES[event.primitive];
      return (
        <Card primitive={event.primitive}>
          <span className="font-medium">
            {event.items.length} {s.label}
            {event.items.length === 1 ? "" : "s"} listed
          </span>{" "}
          <span className="text-xs text-zinc-500">persona: {event.persona}</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {event.items.map((item) => (
              <span
                key={item.name}
                className={`rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-xs dark:border-zinc-700 ${
                  item.isTemplate ? "italic" : ""
                }`}
                title={item.description}
              >
                {item.name}
              </span>
            ))}
          </div>
        </Card>
      );
    }

    case "turn.started":
      return (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          {event.turnId} · {event.trigger}
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      );

    case "user.message":
      return (
        <Card>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            user
          </span>
          <p className="mt-0.5">{event.text}</p>
        </Card>
      );

    case "model.text":
      return (
        <Card>
          <span className="text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-400">
            model
          </span>
          <div className="mt-0.5">
            <Markdown>{event.text}</Markdown>
          </div>
        </Card>
      );

    case "context.snapshot":
      return (
        <Card tone="system">
          <span className="font-medium">Context snapshot</span>{" "}
          <span className="text-xs text-zinc-500">what the model receives · {event.turnId}</span>
          <ul className="mt-1 space-y-0.5 text-xs">
            {event.blocks.map((b, i) => (
              <li key={i} className="text-zinc-600 dark:text-zinc-400">
                {b.kind === "system" && <>⚙ system: {b.summary}</>}
                {b.kind === "message" && (
                  <>
                    💬 {b.role}: {b.summary}
                  </>
                )}
                {b.kind === "tool_definitions" && (
                  <>
                    🔧 {b.count} tool definitions:{" "}
                    <span className="font-mono">{b.names.join(", ")}</span>
                  </>
                )}
                {b.kind === "attached_resource" && (
                  <>
                    📎 resource: {b.name} <span className="font-mono">{b.uri}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Card>
      );

    case "tool.call.requested":
      return (
        <Card primitive="tool">
          <div className="flex items-center gap-2">
            <PrimitiveTag primitive="tool" />
            <span className="font-mono font-medium">{event.toolName}</span>
            {event.turnId === undefined && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                manual
              </span>
            )}
          </div>
          <Json data={event.args} />
        </Card>
      );

    case "tool.call.completed":
      return (
        <Card primitive="tool" tone={event.isError ? "error" : undefined}>
          <div className="flex items-center gap-2">
            <PrimitiveTag primitive="tool" />
            <span className="font-mono font-medium">{event.toolName}</span>
            <span className="text-xs text-zinc-500">{event.latencyMs} ms</span>
            {event.isError ? (
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                isError
              </span>
            ) : (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">✓</span>
            )}
          </div>
          <Raw summary="result" data={event.result} />
        </Card>
      );

    case "resource.read":
      return (
        <Card primitive="resource">
          <PrimitiveTag primitive="resource" />{" "}
          <span className="font-mono font-medium">{event.uri}</span>{" "}
          <span className="text-xs text-zinc-500">{event.latencyMs} ms</span>
          <Raw summary="contents" data={event.contents} />
        </Card>
      );

    case "resource.attached":
      return (
        <Card primitive="resource">
          <PrimitiveTag primitive="resource" /> attached:{" "}
          <span className="font-medium">{event.name}</span>{" "}
          <span className="font-mono text-xs text-zinc-500">{event.uri}</span>
        </Card>
      );

    case "prompt.invoked":
      return (
        <Card primitive="prompt">
          <PrimitiveTag primitive="prompt" />{" "}
          <span className="font-mono font-medium">{event.promptName}</span>
          <Json data={event.args} />
        </Card>
      );

    case "prompt.expanded":
      return (
        <Card primitive="prompt">
          <PrimitiveTag primitive="prompt" />{" "}
          <span className="font-mono font-medium">{event.promptName}</span>{" "}
          <span className="text-xs text-zinc-500">expanded — shown before send</span>
          <div className="mt-1 space-y-1">
            {event.messages.map((m, i) => (
              <p key={i} className="text-xs">
                <span className="font-semibold">{m.role}:</span> {m.content}
              </p>
            ))}
          </div>
        </Card>
      );

    case "rpc.request":
    case "rpc.response":
    case "rpc.notification":
      return (
        <div className="rounded border border-dashed border-zinc-300 px-3 py-1.5 font-mono text-xs text-zinc-500 dark:border-zinc-700">
          <span className="flex items-center gap-2">
            <span>{event.type === "rpc.request" ? "→" : event.type === "rpc.response" ? "←" : "⋯"}</span>
            <span>{event.type}</span>
            {event.method && <span className="text-zinc-400">{event.method}</span>}
            {event.requestId && <span className="text-zinc-400">{event.requestId}</span>}
            {event.type === "rpc.response" && event.http && (
              <>
                <HttpStatus status={event.http.status} />
                {event.http.sse && <span className="text-zinc-400">SSE</span>}
              </>
            )}
          </span>
          <Raw summary="frame" data={event.raw} />
          {event.type === "rpc.response" && event.http && (
            <Raw summary="http headers" data={event.http.headers} />
          )}
        </div>
      );

    case "error":
      return (
        <Card tone="error">
          <span className="font-semibold text-red-700 dark:text-red-400">Error</span>{" "}
          <span className="text-xs text-zinc-500">({event.scope})</span>
          <div className="mt-1 flex items-center gap-2">
            {event.httpStatus !== undefined && <HttpStatus status={event.httpStatus} />}
            {event.code !== undefined && (
              <span className="font-mono text-xs">code {event.code}</span>
            )}
            <span className="font-mono text-sm">{event.message}</span>
          </div>
        </Card>
      );

    case "annotation":
      return (
        <div className="annotation-card rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
          <span className="mr-2">📝</span>
          {event.text}
          {event.pauseOnReplay && (
            <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-200">
              replay pauses here
            </span>
          )}
        </div>
      );
  }
}
