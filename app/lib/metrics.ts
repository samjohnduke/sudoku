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

// ---------------------------------------------------------------------------
// Metrics catalog — machine-readable schema of all tracked data
// ---------------------------------------------------------------------------

export interface MetricFieldDef {
  /** Analytics Engine slot (e.g. "blob1", "double1"). */
  slot: string;
  /** Human-readable name. */
  name: string;
  /** What this field contains. */
  description: string;
}

export interface MetricEventDef {
  /** Event name used as the index value. */
  event: string;
  /** Human description of when this fires. */
  description: string;
  /** Where in the code this is emitted. */
  source: string;
  /** Fields populated for this event. */
  fields: MetricFieldDef[];
  /** Example SQL query to analyse this event. */
  exampleQuery: string;
}

export interface MetricCategoryDef {
  /** Category identifier. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** What this category covers. */
  description: string;
  /** How to filter for this category in SQL. */
  indexPattern: string;
  /** Common field layout for all events in this category. */
  fields: MetricFieldDef[];
  /** Individual events within this category. */
  events: MetricEventDef[];
}

export interface MetricsCatalog {
  /** Analytics Engine dataset name. */
  dataset: string;
  /** When this catalog was generated. */
  version: string;
  /** Metric categories. */
  categories: MetricCategoryDef[];
}

export const METRICS_CATALOG: MetricsCatalog = {
  dataset: "supersudoku_metrics",
  version: "1.0.0",
  categories: [
    {
      id: "requests",
      name: "HTTP Requests",
      description:
        "Automatic request-level metrics emitted for every HTTP request by the Worker entry point.",
      indexPattern: "index1 NOT LIKE 'db:%' AND blob1 NOT IN ('login','signup','signout','new_game','game_start','game_resume','game_save','game_complete','settings_update','sync_migrate','ssr_error')",
      fields: [
        { slot: "blob1", name: "route", description: "URL pathname" },
        { slot: "blob2", name: "method", description: "HTTP method (GET, POST, …)" },
        { slot: "blob3", name: "status", description: "HTTP status code as string" },
        { slot: "double1", name: "duration_ms", description: "Total response time in milliseconds" },
        { slot: "double2", name: "count", description: "Always 1, for COUNT() aggregation" },
      ],
      events: [],
    },
    {
      id: "business",
      name: "Business Events",
      description: "Explicit events tracking user actions and application lifecycle.",
      indexPattern: "index1 IN ('login','signup','signout','new_game','game_start','game_resume','game_save','game_complete','settings_update','sync_migrate','ssr_error')",
      fields: [
        { slot: "blob1", name: "event", description: "Event name" },
        { slot: "blob2", name: "user_id", description: "Authenticated user ID (null for anonymous)" },
        { slot: "blob3", name: "detail", description: "Event-specific context" },
        { slot: "double1", name: "value", description: "Event-specific numeric value (default 1)" },
        { slot: "double2", name: "count", description: "Always 1, for COUNT() aggregation" },
      ],
      events: [
        {
          event: "login",
          description: "User signed in successfully.",
          source: "routes/api.auth.$.ts",
          fields: [
            { slot: "blob2", name: "user_id", description: "Authenticated user ID" },
          ],
          exampleQuery:
            "SELECT COUNT() AS logins, toStartOfInterval(timestamp, INTERVAL '1' HOUR) AS hour FROM supersudoku_metrics WHERE index1 = 'login' AND timestamp > NOW() - INTERVAL '24' HOUR GROUP BY hour ORDER BY hour",
        },
        {
          event: "signup",
          description: "New user account created.",
          source: "routes/api.auth.$.ts",
          fields: [
            { slot: "blob2", name: "user_id", description: "New user ID" },
          ],
          exampleQuery:
            "SELECT COUNT() AS signups FROM supersudoku_metrics WHERE index1 = 'signup' AND timestamp > NOW() - INTERVAL '7' DAY",
        },
        {
          event: "signout",
          description: "User signed out.",
          source: "routes/api.auth.$.ts",
          fields: [
            { slot: "blob2", name: "user_id", description: "User ID" },
          ],
          exampleQuery:
            "SELECT COUNT() AS signouts FROM supersudoku_metrics WHERE index1 = 'signout' AND timestamp > NOW() - INTERVAL '24' HOUR",
        },
        {
          event: "new_game",
          description: "Random puzzle selected via the API (user clicked 'New Puzzle').",
          source: "routes/api.puzzle.random.ts",
          fields: [
            { slot: "blob3", name: "detail", description: "Difficulty range, e.g. '30-50'" },
          ],
          exampleQuery:
            "SELECT blob3 AS difficulty_range, COUNT() AS games FROM supersudoku_metrics WHERE index1 = 'new_game' AND timestamp > NOW() - INTERVAL '24' HOUR GROUP BY difficulty_range",
        },
        {
          event: "game_start",
          description: "First save for a puzzle (user started playing a new puzzle).",
          source: "routes/api.game.save.ts",
          fields: [
            { slot: "blob2", name: "user_id", description: "User ID" },
          ],
          exampleQuery:
            "SELECT COUNT() AS starts FROM supersudoku_metrics WHERE index1 = 'game_start' AND timestamp > NOW() - INTERVAL '7' DAY",
        },
        {
          event: "game_resume",
          description: "User loaded a puzzle with existing in-progress save data.",
          source: "routes/play.$puzzleId.tsx",
          fields: [
            { slot: "blob2", name: "user_id", description: "User ID" },
            { slot: "blob3", name: "detail", description: "Difficulty label" },
          ],
          exampleQuery:
            "SELECT blob3 AS difficulty, COUNT() AS resumes FROM supersudoku_metrics WHERE index1 = 'game_resume' AND timestamp > NOW() - INTERVAL '7' DAY GROUP BY difficulty",
        },
        {
          event: "game_save",
          description: "Game progress saved (auto-save or manual).",
          source: "routes/api.game.save.ts",
          fields: [
            { slot: "blob2", name: "user_id", description: "User ID" },
          ],
          exampleQuery:
            "SELECT COUNT() AS saves, toStartOfInterval(timestamp, INTERVAL '1' HOUR) AS hour FROM supersudoku_metrics WHERE index1 = 'game_save' AND timestamp > NOW() - INTERVAL '24' HOUR GROUP BY hour ORDER BY hour",
        },
        {
          event: "game_complete",
          description: "User solved a puzzle.",
          source: "routes/api.game.save.ts",
          fields: [
            { slot: "blob2", name: "user_id", description: "User ID" },
            { slot: "double1", name: "value", description: "Completion time in seconds" },
          ],
          exampleQuery:
            "SELECT COUNT() AS completions, AVG(double1) AS avg_time_sec, MIN(double1) AS best_time_sec FROM supersudoku_metrics WHERE index1 = 'game_complete' AND timestamp > NOW() - INTERVAL '7' DAY",
        },
        {
          event: "settings_update",
          description: "User changed their settings.",
          source: "routes/api.settings.ts",
          fields: [
            { slot: "blob2", name: "user_id", description: "User ID" },
          ],
          exampleQuery:
            "SELECT COUNT() AS updates FROM supersudoku_metrics WHERE index1 = 'settings_update' AND timestamp > NOW() - INTERVAL '7' DAY",
        },
        {
          event: "sync_migrate",
          description: "Local data migrated to server after sign-in.",
          source: "routes/api.sync.migrate.ts",
          fields: [
            { slot: "blob2", name: "user_id", description: "User ID" },
          ],
          exampleQuery:
            "SELECT COUNT() AS migrations FROM supersudoku_metrics WHERE index1 = 'sync_migrate' AND timestamp > NOW() - INTERVAL '30' DAY",
        },
        {
          event: "ssr_error",
          description: "Server-side rendering error during streaming.",
          source: "entry.server.tsx",
          fields: [
            { slot: "blob3", name: "detail", description: "Error message (truncated to 200 chars)" },
          ],
          exampleQuery:
            "SELECT blob3 AS error_message, COUNT() AS occurrences FROM supersudoku_metrics WHERE index1 = 'ssr_error' AND timestamp > NOW() - INTERVAL '24' HOUR GROUP BY error_message ORDER BY occurrences DESC",
        },
      ],
    },
    {
      id: "db_queries",
      name: "Database Queries",
      description: "Per-query timing for D1 database operations, tracked via the timedQuery() wrapper.",
      indexPattern: "index1 LIKE 'db:%'",
      fields: [
        { slot: "blob1", name: "type", description: "Always 'db_query'" },
        { slot: "blob2", name: "operation", description: "SQL operation: select, insert, update, session" },
        { slot: "blob3", name: "table", description: "Table name: puzzles, user_stats, user_settings, session" },
        { slot: "double1", name: "duration_ms", description: "Query execution time in milliseconds" },
        { slot: "double2", name: "count", description: "Always 1, for COUNT() aggregation" },
      ],
      events: [],
    },
  ],
};
