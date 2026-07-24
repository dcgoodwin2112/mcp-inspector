# Roadmap — learning-tool features

Feature backlog from the 2026-07-23 research pass: how to grow the inspector
from talk demo into an MCP learning tool. Ordering assumes the Aug 12 feature
freeze and Aug 21 talk. Decision history: [mcp-inspector-handoff-plan.md](mcp-inspector-handoff-plan.md).

## Shipped

- Spec-linked event cards ("ⓘ what is this?" + spec links, `src/lib/spec-notes.ts`)
- Concepts legend (primitives + control planes + actor badges, pre-connect)
- Tool-result tabs (text / structuredContent / outputSchema / raw)
- Tool annotation chips (destructive/open-world/non-idempotent in panel rows,
  full set in the manual-call header; `src/lib/annotations.ts`)
- Description-engineering sandbox (rewrite a tool description host-side in
  the Context inspector; verified A/B: poisoned search_datasets description
  → model switches to list_datasets, restore → back to search_datasets)
- Sequence-diagram view (⇄ Diagram toggle in live + replay; swimlanes match
  the actor badges; rows derived by `src/lib/sequence.ts`)
- Three-error-channels lesson (in-band chip on tool results — DKAN returns
  structured error payloads with isError:false; channel-numbered ⓘ notes;
  "when things fail" legend section)

## Before the talk

| # | Feature | Teaches | Impact | Effort |
|---|---------|---------|--------|--------|
| 5 | Context-growth meter | context economics | Medium | Low |

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
