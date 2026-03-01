import * as Sentry from "@sentry/cloudflare";
import { createRequestHandler } from "react-router";

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
      return requestHandler(request, {
        cloudflare: { env, ctx },
      });
    },
  } satisfies ExportedHandler<Env>,
);
