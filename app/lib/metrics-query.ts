/**
 * Generic Cloudflare Analytics Engine query proxy with HMAC auth.
 *
 * Drop this file into any Cloudflare Workers app to expose a secured
 * SQL query endpoint over your Analytics Engine dataset.
 *
 * ## Auth scheme: HMAC-SHA256
 *
 * Inspired by AWS Signature V4. The shared secret never travels over the
 * wire — instead the client signs each request and the server verifies
 * the signature.
 *
 * ### Authorization header format
 *
 *   HMAC-SHA256 Credential=<key-id>,Timestamp=<unix-seconds>,Signature=<hex>
 *
 * ### String to sign (newline-separated)
 *
 *   HMAC-SHA256
 *   <unix-seconds>
 *   <HTTP-METHOD>
 *   <path-with-query>
 *   <sha256-hex-of-body>
 *
 * ### Signing key
 *
 *   HMAC-SHA256(METRICS_API_KEY, "metrics-signing-key")
 *
 *   The raw secret is fed through one HMAC round to derive the signing
 *   key, matching the AWS pattern of deriving a key per scope.
 *
 * ### Replay protection
 *
 *   The server rejects requests where the timestamp differs from server
 *   time by more than ±5 minutes.
 *
 * ## Setup
 *
 * 1. Add three secrets to your Worker:
 *      CLOUDFLARE_ACCOUNT_ID      – your CF account ID
 *      CLOUDFLARE_ANALYTICS_TOKEN – API token with "Account Analytics: Read"
 *      METRICS_API_KEY            – shared HMAC secret
 *
 * 2. Create a route that calls `handleMetricsQuery()`.
 *
 * ## Usage from curl
 *
 *   # Use the signRequest() helper in a Node/Bun script, or sign manually:
 *   TIMESTAMP=$(date +%s)
 *   BODY='{"query":"SELECT COUNT() FROM my_dataset"}'
 *   BODY_HASH=$(echo -n "$BODY" | sha256sum | cut -d' ' -f1)
 *   STRING_TO_SIGN="HMAC-SHA256\n${TIMESTAMP}\nPOST\n/api/metrics\n${BODY_HASH}"
 *   # sign with your METRICS_API_KEY...
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
// HMAC auth scheme
// ---------------------------------------------------------------------------

const SCHEME = "HMAC-SHA256";
const TIMESTAMP_TOLERANCE_SEC = 300; // ±5 minutes
const SIGNING_KEY_LABEL = "metrics-signing-key";

/**
 * Derive a signing key from the raw secret.
 * signingKey = HMAC-SHA256(rawSecret, "metrics-signing-key")
 */
async function deriveSigningKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const derived = await crypto.subtle.sign(
    "HMAC",
    rawKey,
    encoder.encode(SIGNING_KEY_LABEL),
  );
  return crypto.subtle.importKey(
    "raw",
    derived,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** SHA-256 hex digest of a string. */
async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hex-encode an ArrayBuffer. */
function hexEncode(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Decode a hex string to Uint8Array. */
function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Build the canonical string to sign.
 *
 * Format (newline-separated):
 *   HMAC-SHA256
 *   <timestamp>
 *   <METHOD>
 *   <path-with-query>
 *   <body-sha256-hex>
 */
export function buildStringToSign(
  timestamp: number,
  method: string,
  pathWithQuery: string,
  bodyHash: string,
): string {
  return [SCHEME, String(timestamp), method.toUpperCase(), pathWithQuery, bodyHash].join(
    "\n",
  );
}

/**
 * Sign a metrics API request. Use this client-side or in scripts.
 *
 * Returns the full Authorization header value.
 *
 * @param secret   - The METRICS_API_KEY shared secret.
 * @param keyId    - An identifier for the key (e.g. "default"). Included
 *                   in the header for multi-key support.
 * @param method   - HTTP method (GET, POST).
 * @param pathWithQuery - Path including query string, e.g. "/api/metrics?query=..."
 * @param body     - Request body string (empty string for GET).
 * @param timestamp - Unix epoch seconds. Defaults to now.
 */
export async function signRequest(
  secret: string,
  keyId: string,
  method: string,
  pathWithQuery: string,
  body: string = "",
  timestamp: number = Math.floor(Date.now() / 1000),
): Promise<{ authorization: string; timestamp: number }> {
  const signingKey = await deriveSigningKey(secret);
  const bodyHash = await sha256Hex(body);
  const sts = buildStringToSign(timestamp, method, pathWithQuery, bodyHash);

  const sig = await crypto.subtle.sign(
    "HMAC",
    signingKey,
    new TextEncoder().encode(sts),
  );

  const authorization = `${SCHEME} Credential=${keyId},Timestamp=${timestamp},Signature=${hexEncode(sig)}`;
  return { authorization, timestamp };
}

/** Parsed components from the Authorization header. */
interface ParsedHmacAuth {
  keyId: string;
  timestamp: number;
  signature: string;
}

/** Parse the HMAC-SHA256 Authorization header. Returns null if malformed. */
function parseAuthHeader(header: string): ParsedHmacAuth | null {
  if (!header.startsWith(SCHEME + " ")) return null;

  const params = header.slice(SCHEME.length + 1);
  const parts: Record<string, string> = {};
  for (const segment of params.split(",")) {
    const eq = segment.indexOf("=");
    if (eq === -1) return null;
    const key = segment.slice(0, eq).trim();
    const val = segment.slice(eq + 1).trim();
    parts[key] = val;
  }

  if (!parts.Credential || !parts.Timestamp || !parts.Signature) return null;

  const timestamp = parseInt(parts.Timestamp, 10);
  if (!Number.isFinite(timestamp)) return null;

  return {
    keyId: parts.Credential,
    timestamp,
    signature: parts.Signature,
  };
}

/**
 * Verify an HMAC-signed request.
 *
 * @returns true if the signature is valid and timestamp is within tolerance.
 */
export async function verifyHmacAuth(
  request: Request,
  secret: string,
  body: string,
): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  const parsed = parseAuthHeader(authHeader);
  if (!parsed) return false;

  // Replay protection: reject stale timestamps
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.timestamp) > TIMESTAMP_TOLERANCE_SEC) {
    return false;
  }

  // Reconstruct the string to sign
  const url = new URL(request.url);
  const pathWithQuery = url.pathname + url.search;
  const bodyHash = await sha256Hex(body);
  const sts = buildStringToSign(
    parsed.timestamp,
    request.method,
    pathWithQuery,
    bodyHash,
  );

  // Derive the signing key and compute expected signature
  const signingKey = await deriveSigningKey(secret);
  const expectedSig = await crypto.subtle.sign(
    "HMAC",
    signingKey,
    new TextEncoder().encode(sts),
  );

  // Constant-time comparison
  const expectedBytes = new Uint8Array(expectedSig);
  const providedBytes = hexDecode(parsed.signature);

  if (expectedBytes.length !== providedBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < expectedBytes.length; i++) {
    diff |= expectedBytes[i] ^ providedBytes[i];
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Query validation
// ---------------------------------------------------------------------------

const DANGEROUS_KEYWORDS =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b/i;

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
  /** Shared HMAC secret for request signing. */
  METRICS_API_KEY?: string;
}

/**
 * Full request handler for the metrics query endpoint.
 *
 * Supports:
 *  - GET  /api/metrics?query=SELECT...
 *  - POST /api/metrics  { "query": "SELECT..." }
 *
 * Auth (checked in order, first match wins):
 *  1. HMAC-SHA256 signature in Authorization header
 *  2. Custom `isAuthorized` callback (e.g. session-based)
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
     * Optional fallback auth check (e.g. session-based admin).
     * Called only when HMAC auth fails or is not configured.
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

  // ── Read body upfront (needed for both HMAC verification and query parsing) ──
  let bodyText = "";
  if (request.method === "POST") {
    bodyText = await request.text();
  }

  // ── Auth ──
  let authorized = false;

  if (env.METRICS_API_KEY && request.headers.get("Authorization")) {
    authorized = await verifyHmacAuth(request, env.METRICS_API_KEY, bodyText);
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
      const body = JSON.parse(bodyText) as { query?: string };
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
