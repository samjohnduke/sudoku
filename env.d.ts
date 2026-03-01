// Secret bindings not included in wrangler types generation
interface Env {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  /** Cloudflare Analytics Engine – optional, metrics are no-ops when unbound. */
  METRICS?: AnalyticsEngineDataset;
}
