/**
 * Generic Cloudflare Analytics Engine query proxy.
 *
 * Drop this file into any Cloudflare Workers app to expose a secured
 * SQL query endpoint over your Analytics Engine dataset.
 *
 * ## Setup
 *
 * 1. Add three secrets to your Worker:
 *      CLOUDFLARE_ACCOUNT_ID   – your CF account ID
 *      CLOUDFLARE_ANALYTICS_TOKEN – API token with "Account Analytics: Read"
 *      METRICS_API_KEY         – shared secret callers send as Bearer token
 *
 * 2. Create a route that calls `handleMetricsQuery()`.
 *
 * ## Usage from curl / Grafana / scripts
 *
 *   curl 'https://your-app.dev/api/metrics' \
 *     -H 'Authorization: Bearer <METRICS_API_KEY>' \
 *     -H 'Content-Type: application/json' \
 *     -d '{ "query": "SELECT ... FROM your_dataset WHERE ..." }'
 *
 *   # or GET with query param
 *   curl 'https://your-app.dev/api/metrics?query=SELECT+...' \
 *     -H 'Authorization: Bearer <METRICS_API_KEY>'
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface MetricsQueryConfig {
  /** Cloudflare account ID. */
  accountId: string;
  /** API token with Analytics Engine read permission. */
  apiToken: string;
  /** Dataset name queries are restricted to. */
  dataset: string;
  /** Max rows returned (appended as LIMIT when absent). Default 1000. */
  maxRows?: number;
}

// ---------------------------------------------------------------------------
// Query validation
// ---------------------------------------------------------------------------

const DANGEROUS_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b/i;

/**
 * Validates a SQL query against the allowed dataset.
 * Returns a sanitised query string or an error message.
 */
export function validateQuery(
  raw: string,
  dataset: string,
  maxRows: number,
): { ok: true; sql: string } | { ok: false; error: string } {
  const trimmed = raw.trim().replace(/;+$/, "").trim();

  if (!trimmed) {
    return { ok: false, error: "Query must not be empty" };
  }

  if (!trimmed.toUpperCase().startsWith("SELECT")) {
    return { ok: false, error: "Only SELECT queries are allowed" };
  }

  if (DANGEROUS_KEYWORDS.test(trimmed)) {
    return { ok: false, error: "Query contains disallowed keywords" };
  }

  // Must reference the configured dataset (case-insensitive)
  if (!trimmed.toLowerCase().includes(dataset.toLowerCase())) {
    return {
      ok: false,
      error: `Query must reference the '${dataset}' dataset`,
    };
  }

  // Append LIMIT if not present
  const hasLimit = /\bLIMIT\s+\d+/i.test(trimmed);
  const sql = hasLimit ? trimmed : `${trimmed} LIMIT ${maxRows}`;

  return { ok: true, sql };
}

// ---------------------------------------------------------------------------
// API key comparison (constant-time)
// ---------------------------------------------------------------------------

/**
 * Constant-time string comparison using Web Crypto.
 * Falls back to byte-by-byte XOR when `crypto.subtle` is unavailable.
 */
export async function secureCompare(
  a: string,
  b: string,
): Promise<boolean> {
  if (a.length !== b.length) return false;

  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);

  if (typeof crypto !== "undefined" && crypto.subtle) {
    // Use HMAC-based comparison: import both as keys and compare digests
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode("metrics-compare"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const [sigA, sigB] = await Promise.all([
      crypto.subtle.sign("HMAC", key, aBuf),
      crypto.subtle.sign("HMAC", key, bBuf),
    ]);
    const viewA = new Uint8Array(sigA);
    const viewB = new Uint8Array(sigB);
    let diff = 0;
    for (let i = 0; i < viewA.length; i++) {
      diff |= viewA[i] ^ viewB[i];
    }
    return diff === 0;
  }

  // Fallback: XOR comparison
  let diff = 0;
  for (let i = 0; i < aBuf.length; i++) {
    diff |= aBuf[i] ^ bBuf[i];
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Analytics Engine SQL API client
// ---------------------------------------------------------------------------

const CF_API_BASE = "https://api.cloudflare.com/client/v4/accounts";

export interface AnalyticsQueryResult {
  data: Record<string, unknown>[];
  meta: { name: string; type: string }[];
  rows: number;
  rows_before_limit_at_least: number;
}

/**
 * Execute a validated SQL query against the CF Analytics Engine SQL API.
 */
export async function executeQuery(
  config: MetricsQueryConfig,
  sql: string,
): Promise<
  | { ok: true; result: AnalyticsQueryResult }
  | { ok: false; error: string; status: number }
> {
  const url = `${CF_API_BASE}/${config.accountId}/analytics_engine/sql`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "text/plain",
    },
    body: sql,
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      error: `Analytics Engine API error: ${text}`,
      status: response.status,
    };
  }

  const result = (await response.json()) as AnalyticsQueryResult;
  return { ok: true, result };
}

// ---------------------------------------------------------------------------
// Request handler (generic, framework-agnostic)
// ---------------------------------------------------------------------------

export interface MetricsHandlerEnv {
  /** Cloudflare account ID. */
  CLOUDFLARE_ACCOUNT_ID?: string;
  /** API token with Analytics Engine read permission. */
  CLOUDFLARE_ANALYTICS_TOKEN?: string;
  /** Shared secret callers send as `Authorization: Bearer <key>`. */
  METRICS_API_KEY?: string;
}

/**
 * Full request handler for the metrics query endpoint.
 *
 * Supports:
 *  - GET  /api/metrics?query=SELECT...
 *  - POST /api/metrics  { "query": "SELECT..." }
 *
 * Auth:
 *  - `Authorization: Bearer <METRICS_API_KEY>` header
 *  - Or pass a custom `isAuthorized` function for session-based auth
 *
 * Returns a Response suitable for returning directly from a Worker/route.
 */
export async function handleMetricsQuery(
  request: Request,
  env: MetricsHandlerEnv,
  opts: {
    dataset: string;
    maxRows?: number;
    /**
     * Optional extra auth check (e.g. session-based admin).
     * Called only when the API key check fails or is not configured.
     * Return true to allow the request.
     */
    isAuthorized?: () => Promise<boolean>;
  },
): Promise<Response> {
  // ── Check configuration ──
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_ANALYTICS_TOKEN) {
    return Response.json(
      { error: "Metrics query API is not configured" },
      { status: 501 },
    );
  }

  // ── Auth ──
  const authHeader = request.headers.get("Authorization");
  const bearerToken =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let authorized = false;

  if (bearerToken && env.METRICS_API_KEY) {
    authorized = await secureCompare(bearerToken, env.METRICS_API_KEY);
  }

  if (!authorized && opts.isAuthorized) {
    authorized = await opts.isAuthorized();
  }

  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Extract query ──
  let sql: string | null = null;

  if (request.method === "GET") {
    const url = new URL(request.url);
    sql = url.searchParams.get("query");
  } else if (request.method === "POST") {
    try {
      const body = (await request.json()) as { query?: string };
      sql = body.query ?? null;
    } catch {
      return Response.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }
  } else {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405 },
    );
  }

  if (!sql) {
    return Response.json(
      { error: "Missing 'query' parameter" },
      { status: 400 },
    );
  }

  // ── Validate ──
  const maxRows = opts.maxRows ?? 1000;
  const validated = validateQuery(sql, opts.dataset, maxRows);

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  // ── Execute ──
  const result = await executeQuery(
    {
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_ANALYTICS_TOKEN,
      dataset: opts.dataset,
    },
    validated.sql,
  );

  if (!result.ok) {
    return Response.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return Response.json(result.result, {
    headers: {
      "Cache-Control": "private, max-age=30",
    },
  });
}
