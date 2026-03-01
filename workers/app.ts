import * as Sentry from "@sentry/cloudflare";
import { createRequestHandler } from "react-router";
import { getMetrics, trackRequest } from "~/lib/metrics";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: "https://68faf3f9978487291040731f08f99703@o4504183261560832.ingest.us.sentry.io/4510970684899328",
    tracesSampleRate: 1.0,
  }),
  {
    async fetch(request, env, ctx) {
      const start = Date.now();
      const response = await requestHandler(request, {
        cloudflare: { env, ctx },
      });
      
      const metrics = getMetrics(env);
      if (metrics) {
        const url = new URL(request.url);
        trackRequest(metrics, {
          route: url.pathname,
          method: request.method,
          status: response.status,
          durationMs: Date.now() - start,
        });
      }

      return response;
    },
  } satisfies ExportedHandler<Env>,
);
