import Anthropic from "@anthropic-ai/sdk";

/**
 * One model call per request — the agent LOOP lives client-side (src/lib/
 * agent.ts) so every hop lands in the event log with step control between
 * hops. This route only holds the API key.
 */

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set in .env.local — agent mode is disabled." },
      { status: 503 },
    );
  }

  const { system, messages, tools } = (await request.json()) as {
    system: string;
    messages: Anthropic.MessageParam[];
    tools: Array<{ name: string; description?: string; input_schema: unknown }>;
  };

  const client = new Anthropic();
  const t0 = performance.now();
  try {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
      max_tokens: 2048,
      system,
      messages,
      tools: tools as Anthropic.Tool[],
    });
    return Response.json({
      content: response.content,
      stop_reason: response.stop_reason,
      latencyMs: Math.round(performance.now() - t0),
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
