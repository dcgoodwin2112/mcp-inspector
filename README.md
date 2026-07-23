# MCP Inspector

Server-agnostic MCP demo client for the talk "MCP from Concept to Demo: An Open
Data Example with DKAN" (Drupal AI Learners Club, Aug 21, 2026). Teaches MCP's
three primitives by making the control distinction visible: tools are
model-controlled, prompts are user-controlled, resources are app-controlled.

Plan and architecture: [mcp-inspector-handoff-plan.md](mcp-inspector-handoff-plan.md).

## How it works

- The append-only **event log is the single source of truth** — timeline,
  replay, capability diff, and the raw-frames drawer are pure renderings of it.
  Live and replay share one renderer. Schema: `src/lib/events.ts` (zod).
- **Server-side proxy** (`/api/mcp`): mints OAuth `client_credentials` tokens
  per persona (re-mint before the 300s expiry), forwards JSON-RPC, parses SSE.
  Secrets and tokens never reach the browser; logs are redacted at write time.
- **Agent loop** (`src/lib/agent.ts`) runs client-side so every hop lands in
  the log; `/api/agent` only holds the Anthropic key.

## Setup

Requires a running DKAN site with `dkan_mcp_server` + the simple_oauth stack
and two `client_credentials` consumers (see the plan's provisioning checklist).

```bash
npm install
cp .env.local.example .env.local   # fill in consumer secrets + Anthropic key
npm run dev
```

`.env.local` keys: `DKAN_MCP_URL`, `DKAN_OAUTH_TOKEN_URL`,
`DKAN_ALLOW_SELF_SIGNED`, `PERSONA_{READONLY,EDITOR}_CLIENT_{ID,SECRET}` +
`_SCOPE`, `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL`.

## Using it

- **Live**: pick a persona, Connect. Click tools/prompts/resources in the left
  rail to call/expand/attach; chat bar drives agent mode ("step between hops"
  gates each hop). Switching personas appends to the same log — that powers
  the capability diff. `▶ Replay recording` / `⬇ Save .json` on the timeline.
- **Replay**: recording picker + play/step controls. The golden demo recording
  (`src/lib/fixtures/goldens/full-demo.json`) auto-pauses at narration cards.
- **`{ } Raw frames`**: JSON-RPC exchanges paired by request id, hidden from
  the main timeline.

Keyboard: `p` presentation mode (130% scale, hidden chrome), `Esc` exit,
`space` play/pause, `←/→` step, `Home`/`End` jump.

## Scripts

```bash
npm run typecheck
npm run validate:fixture                      # zod-validate the authored fixture
npx tsx scripts/annotate-golden.ts <log.json> # recorded session → annotated golden
```
