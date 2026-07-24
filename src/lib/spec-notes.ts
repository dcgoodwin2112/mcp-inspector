import type { InspectorEvent } from "./events";

/**
 * One-sentence teaching note per event type, with a link into the MCP spec
 * revision this server implements. Rendered as the ⓘ disclosure on timeline
 * cards — live and replay share them, so recordings self-explain.
 */

export interface SpecNote {
  text: string;
  href?: string;
}

const SPEC = "https://modelcontextprotocol.io/specification/2025-06-18";

export function specNote(event: InspectorEvent): SpecNote | undefined {
  switch (event.type) {
    case "session.started":
      return {
        text: "The inspector opened a connection profile. MCP itself begins with the initialize handshake — everything before that is transport setup.",
        href: `${SPEC}/basic/transports`,
      };
    case "mcp.initialized":
      return {
        text: "initialize is MCP's opening handshake: client and server exchange protocol versions and declare capabilities, so each side knows what the other supports.",
        href: `${SPEC}/basic/lifecycle`,
      };
    case "auth.persona.selected":
      return {
        text: "Personas here are two OAuth clients with different scopes — the server filters what each token may list and call.",
        href: `${SPEC}/basic/authorization`,
      };
    case "auth.oauth.step":
      return {
        text: "HTTP transports use OAuth 2.1. This client_credentials grant trades a client id + secret for a short-lived bearer token.",
        href: `${SPEC}/basic/authorization`,
      };
    case "auth.token.received":
      return {
        text: "The access token authorizes every request that follows. The inspector redacts it at write time — a real token never enters this log.",
        href: `${SPEC}/basic/authorization`,
      };
    case "capabilities.listed":
      switch (event.primitive) {
        case "tool":
          return {
            text: "tools/list returns what the MODEL may call — each tool carries a JSON Schema the model uses to build arguments. Model-controlled.",
            href: `${SPEC}/server/tools`,
          };
        case "resource":
          return {
            text: "resources/list and resources/templates/list return data the APP can attach to context. The model never fetches these itself. App-controlled.",
            href: `${SPEC}/server/resources`,
          };
        case "prompt":
          return {
            text: "prompts/list returns user-invokable templates — the slash commands in the chat box. User-controlled.",
            href: `${SPEC}/server/prompts`,
          };
      }
      return undefined;
    case "tool.call.requested":
      return {
        text: "tools/call. A 'manual' badge means a human built the arguments; otherwise the model chose this tool and filled its args from the schema.",
        href: `${SPEC}/server/tools`,
      };
    case "tool.call.completed":
      return {
        text: "A tool result: content blocks for the model, plus optional structuredContent matching the tool's declared outputSchema. Tool-level failures set isError instead of a protocol error.",
        href: `${SPEC}/server/tools`,
      };
    case "resource.read":
      return {
        text: "resources/read fetches by URI. The app decides when to read and what to do with the contents — the model is not involved.",
        href: `${SPEC}/server/resources`,
      };
    case "resource.attached":
      return {
        text: "The app placed this resource's text into the model's context (this inspector appends it to the system prompt).",
        href: `${SPEC}/server/resources`,
      };
    case "resource.detached":
      return {
        text: "The app removed this resource from context — the next model call will not include it.",
        href: `${SPEC}/server/resources`,
      };
    case "prompt.invoked":
      return {
        text: "prompts/get expands a named template with the user's arguments into concrete messages.",
        href: `${SPEC}/server/prompts`,
      };
    case "prompt.expanded":
      return {
        text: "The expansion is shown BEFORE sending — user-controlled means the user sees and approves what a prompt will say.",
        href: `${SPEC}/server/prompts`,
      };
    case "user.message":
      return {
        text: "Host-side: the user's message enters the agent loop. This is not an MCP message — MCP carries only the tool, resource, and prompt traffic.",
        href: `${SPEC}/architecture`,
      };
    case "model.text":
      return {
        text: "Host-side: the model's reply. The loop ends when a response contains no tool calls.",
        href: `${SPEC}/architecture`,
      };
    case "context.snapshot":
      return {
        text: "Host-side: exactly what the next model call will send — system prompt, conversation, and the tool definitions from tools/list. Nothing else exists for the model.",
        href: `${SPEC}/architecture`,
      };
    case "context.updated":
      return {
        text: "Host-side edit to the model's context. The server is unaffected — this changes only what the model sees.",
        href: `${SPEC}/architecture`,
      };
    case "error":
      return {
        text: "A JSON-RPC protocol error — the layer below tool results. Compare tool-level isError results (which the model sees) and transport-level failures.",
        href: `${SPEC}/basic`,
      };
    case "session.ended":
      return {
        text: "The MCP session closed. Sessions on this transport are identified by the Mcp-Session-Id header.",
        href: `${SPEC}/basic/transports`,
      };
    default:
      return undefined;
  }
}
