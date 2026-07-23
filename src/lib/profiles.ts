/**
 * Connection profiles — SERVER-SIDE ONLY (holds client secrets from
 * .env.local). The browser gets PublicProfile via GET /api/profile; secrets
 * and tokens never leave the server.
 */

export interface PersonaConfig {
  key: string;
  label: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}

export interface ConnectionProfile {
  name: string;
  mcpUrl: string;
  tokenUrl: string;
  allowSelfSigned: boolean;
  personas: Record<string, PersonaConfig>;
}

export interface PublicPersona {
  key: string;
  label: string;
  scope: string;
}

export interface PublicProfile {
  name: string;
  mcpUrl: string;
  personas: PublicPersona[];
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name} — see .env.local`);
  return v;
}

export function getProfile(): ConnectionProfile {
  return {
    name: process.env.DKAN_PROFILE_NAME ?? "DKAN demo site",
    mcpUrl: env("DKAN_MCP_URL"),
    tokenUrl: env("DKAN_OAUTH_TOKEN_URL"),
    allowSelfSigned: process.env.DKAN_ALLOW_SELF_SIGNED === "1",
    personas: {
      "read-only": {
        key: "read-only",
        label: "Read-only",
        clientId: env("PERSONA_READONLY_CLIENT_ID"),
        clientSecret: env("PERSONA_READONLY_CLIENT_SECRET"),
        scope: env("PERSONA_READONLY_SCOPE"),
      },
      editor: {
        key: "editor",
        label: "Editor",
        clientId: env("PERSONA_EDITOR_CLIENT_ID"),
        clientSecret: env("PERSONA_EDITOR_CLIENT_SECRET"),
        scope: env("PERSONA_EDITOR_SCOPE"),
      },
    },
  };
}

export function getPublicProfile(): PublicProfile {
  const p = getProfile();
  return {
    name: p.name,
    mcpUrl: p.mcpUrl,
    personas: Object.values(p.personas).map(({ key, label, scope }) => ({ key, label, scope })),
  };
}
