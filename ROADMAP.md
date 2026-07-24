# Roadmap — learning-tool features

Feature backlog from the 2026-07-23 research pass: how to grow the inspector
from talk demo into an MCP learning tool. Ordering assumes the Aug 12 feature
freeze and Aug 21 talk. Decision history: [mcp-inspector-handoff-plan.md](mcp-inspector-handoff-plan.md).

## Shipped

- Spec-linked event cards ("ⓘ what is this?" + spec links, `src/lib/spec-notes.ts`)
- Concepts legend (primitives + control planes + actor badges, pre-connect)
- Tool-result tabs (text / structuredContent / outputSchema / raw)

## Before the talk

| # | Feature | Teaches | Impact | Effort |
|---|---------|---------|--------|--------|
| 1 | Tool annotation chips | tool hints vs. enforcement | High | Low |
| 2 | Description-engineering sandbox | tool descriptions steer the model | Very high | Medium |
| 3 | Sequence-diagram view of the log | who talks to whom | High | Medium |
| 4 | Three-error-channels lesson | isError vs JSON-RPC vs HTTP | High | Low-med |
| 5 | Context-growth meter | context economics | Medium | Low |

1. **Annotation chips.** DKAN ships `annotations` on every tool in three
   distinct shapes: read-only/idempotent (25 read tools), destructive
   (`update_dataset`, `delete_dataset`, …), and non-idempotent/open-world
   (`run_harvest`, `import_resource`). Render chips in the capability panel
   dropdowns and the manual-call header (e.g. `read-only`, `destructive`,
   `open-world`). Teaching point: annotations are *advisory hints* for hosts —
   the spec says clients must not trust them for security. The real
   enforcement is the 403 beat; chips make the write tools visually dangerous
   the moment the Editor diff appears. Capture `annotations` into
   `CapabilityItem` (additive, same pattern as `outputSchema`).
2. **Description sandbox.** Context Inspector gains per-tool description
   editing (host-side override, logged as `context.updated`); re-ask a
   question and watch tool choice change. "Your description is a prompt" is
   the highest-value lesson for an audience writing MCP servers.
3. **Sequence diagram.** Alternate rendering of the event log as
   browser ⇄ proxy ⇄ server swimlanes. Pure log rendering; works in replay.
4. **Error channels.** Show a tool-level `isError` result (bad datastore
   query) beside the JSON-RPC 403/-32002 and a transport failure; small
   comparison card.
5. **Context meter.** Chart tokens per hop from `context.snapshot` events.

## After the talk

- **Guided lesson mode** — "Learn" tab with checkpoints verified against the
  live log. The flagship conversion from demo to tutorial.
- **Authored fixtures for sampling / elicitation** — narrated synthetic
  recordings for primitives DKAN doesn't implement; insulated from the
  2026-07-28 spec churn (multi-round-trip requests replace server-initiated
  elicitation/sampling).
- **Challenge mode** — log-verified exercises ("trigger a 403", "answer
  without search_datasets").
- **Session export** — annotated markdown writeup of any session.
- **Real elicitation/logging in dkan_mcp_server** — cross-repo; wait for the
  2026-07-28 spec to settle.
- **Multi-server composition** — namespaced tools from two servers; large
  proxy/profile rework.
- Deferred a11y: aria-live timeline region, keyboard-resizable drag handles.
