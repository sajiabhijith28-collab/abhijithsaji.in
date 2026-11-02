import { spawnSync } from "child_process";
import type { LocalDatabaseSchema } from "./seed-data";

/**
 * Durable storage bridge for serverless hosting (Vercel).
 *
 * Vercel instances do not share memory or disk, so doctors added by the admin
 * would be lost. When NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
 * set, the whole store snapshot is mirrored to the Supabase table `app_state`
 * (row id = "main"). Without those variables nothing changes (local/dev mode).
 *
 * The store API is synchronous, so the HTTP call runs in a short child Node
 * process via spawnSync. Reads are throttled by the caller.
 */

export function remoteEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const CHILD_SCRIPT = `
const base = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\\/$/, '') + '/rest/v1/app_state';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
const mode = process.argv[1];
const out = (o) => process.stdout.write(JSON.stringify(o));
(async () => {
  if (mode === 'get') {
    const r = await fetch(base + '?id=eq.main&select=rev,data', { headers });
    if (!r.ok) return out({ error: r.status + ' ' + (await r.text()) });
    const rows = await r.json();
    return out({ row: rows[0] || null });
  }
  let body = '';
  for await (const c of process.stdin) body += c;
  const r = await fetch(base, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body,
  });
  out(r.ok ? { ok: true } : { error: r.status + ' ' + (await r.text()) });
})().catch((e) => out({ error: String(e) }));
`;

function runChild(
  mode: "get" | "put",
  input?: string
): { row?: { rev: string; data: LocalDatabaseSchema } | null; ok?: boolean; error?: string } {
  const res = spawnSync(process.execPath, ["-e", CHILD_SCRIPT, mode], {
    input,
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
  });
  if (res.error) return { error: String(res.error) };
  try {
    return JSON.parse(res.stdout || "{}");
  } catch {
    return { error: res.stderr || "Invalid response from storage helper" };
  }
}

export function remoteFetchSnapshot():
  | { rev: string; data: LocalDatabaseSchema }
  | null
  | "error" {
  const out = runChild("get");
  if (out.error) {
    console.error("[remote-sync] fetch failed:", out.error);
    return "error";
  }
  return out.row || null;
}

export function remotePushSnapshot(
  db: LocalDatabaseSchema,
  rev: string
): boolean {
  const out = runChild(
    "put",
    JSON.stringify({
      id: "main",
      rev,
      data: db,
      updated_at: new Date().toISOString(),
    })
  );
  if (out.error) {
    console.error("[remote-sync] save failed:", out.error);
    return false;
  }
  return Boolean(out.ok);
}
