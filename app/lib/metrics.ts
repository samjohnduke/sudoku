/**
 * Lightweight observability metrics built on Cloudflare Analytics Engine.
 *
 * Analytics Engine stores data points with up to 20 doubles (numeric) and
 * 25 blobs (string) fields plus 1 index field used for fast filtering.
 *
 * ## Data layout conventions
 *
 * **Request metrics** (index = route path):
 *   blob1: route       blob2: method     blob3: status code
 *   double1: duration_ms   double2: 1 (count)
 *
 * **Business events** (index = event name):
 *   blob1: event name  blob2: user_id    blob3: detail
 *   double1: value     double2: 1 (count)
 *
 * **DB queries** (index = "db:{table}:{op}"):
 *   blob1: "db_query"  blob2: operation  blob3: table
 *   double1: duration_ms   double2: 1 (count)
 *
 * ## Querying
 *
 * Use the Cloudflare dashboard, GraphQL API, or Grafana with the
 * Cloudflare plugin. Example SQL via the Analytics Engine SQL API:
 *
 *   SELECT
 *     blob1 AS route,
 *     blob2 AS method,
 *     COUNT() AS requests,
 *     AVG(double1) AS avg_duration_ms,
 *     SUM(IF(blob3 >= '500', 1, 0)) AS errors
 *   FROM supersudoku_metrics
 *   WHERE index1 NOT LIKE 'db:%'
 *     AND timestamp > NOW() - INTERVAL '1' HOUR
 *   GROUP BY route, method
 *   ORDER BY requests DESC
 */

// Re-export the type so consumers don't depend on Cloudflare globals directly
export type MetricsEngine = {
  writeDataPoint(event: {
    indexes?: (string | null)[];
    doubles?: number[];
    blobs?: ((ArrayBuffer | string) | null)[];
  }): void;
};

/**
 * Safely get the metrics engine from the env. Returns undefined if the
 * Analytics Engine binding is not configured (e.g. local dev, free tier).
 */
export function getMetrics(env: Env): MetricsEngine | undefined {
  return env.METRICS as MetricsEngine | undefined;
}

// ---------------------------------------------------------------------------
// Request-level metrics
// ---------------------------------------------------------------------------

/** Track an HTTP request/response cycle. Called from the Worker entry point. */
export function trackRequest(
  metrics: MetricsEngine | undefined,
  opts: {
    route: string;
    method: string;
    status: number;
    durationMs: number;
  },
) {
  metrics?.writeDataPoint({
    indexes: [opts.route],
    blobs: [opts.route, opts.method, String(opts.status)],
    doubles: [opts.durationMs, 1],
  });
}

// ---------------------------------------------------------------------------
// Business events
// ---------------------------------------------------------------------------

/**
 * Track a business event such as login, signup, game_complete, etc.
 *
 * @param name   - Event name, e.g. "login", "game_complete", "new_game"
 * @param userId - Optional authenticated user ID
 * @param detail - Optional extra context, e.g. difficulty label
 * @param value  - Optional numeric value, e.g. completion time in seconds
 */
export function trackEvent(
  metrics: MetricsEngine | undefined,
  name: string,
  opts?: {
    userId?: string;
    detail?: string;
    value?: number;
  },
) {
  metrics?.writeDataPoint({
    indexes: [name],
    blobs: [name, opts?.userId ?? null, opts?.detail ?? null],
    doubles: [opts?.value ?? 1, 1],
  });
}

// ---------------------------------------------------------------------------
// DB query metrics
// ---------------------------------------------------------------------------

/** Track a database query with timing. */
export function trackDbQuery(
  metrics: MetricsEngine | undefined,
  opts: {
    operation: string; // "select" | "insert" | "update" | "delete"
    table: string;
    durationMs: number;
  },
) {
  metrics?.writeDataPoint({
    indexes: [`db:${opts.table}:${opts.operation}`],
    blobs: ["db_query", opts.operation, opts.table],
    doubles: [opts.durationMs, 1],
  });
}

/**
 * Convenience wrapper: runs a DB query and records its timing.
 *
 * Usage:
 *   const row = await timedQuery(metrics, "select", "puzzles", () =>
 *     db.select().from(puzzles).where(...).get()
 *   );
 */
export async function timedQuery<T>(
  metrics: MetricsEngine | undefined,
  operation: string,
  table: string,
  query: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  const result = await query();
  trackDbQuery(metrics, { operation, table, durationMs: Date.now() - start });
  return result;
}
