// Secret bindings not included in wrangler types generation
interface Env {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  /** Cloudflare Analytics Engine – optional, metrics are no-ops when unbound. */
  METRICS?: AnalyticsEngineDataset;
  /** CF account ID – required for the /api/metrics query endpoint. */
  CLOUDFLARE_ACCOUNT_ID?: string;
  /** API token with "Account Analytics: Read" – required for /api/metrics. */
  CLOUDFLARE_ANALYTICS_TOKEN?: string;
  /** Shared secret for Bearer auth on /api/metrics. Optional if session auth suffices. */
  METRICS_API_KEY?: string;
}
