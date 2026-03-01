import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { handleMetricsQuery } from "~/lib/metrics-query";
import { METRICS_CATALOG } from "~/lib/metrics";
import { getSessionUser } from "~/lib/auth/auth.server";

const DATASET = "supersudoku_metrics";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // GET /api/metrics?catalog — return the metrics definitions
  if (url.searchParams.has("catalog")) {
    return Response.json(METRICS_CATALOG, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  // GET /api/metrics?query=... — execute a query
  const { cloudflare } = context as { cloudflare: { env: Env } };
  return handleMetricsQuery(request, cloudflare.env, {
    dataset: DATASET,
    maxRows: 10_000,
    isAuthorized: async () => {
      const user = await getSessionUser(request, cloudflare.env);
      return user !== null;
    },
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  return handleMetricsQuery(request, cloudflare.env, {
    dataset: DATASET,
    maxRows: 10_000,
    isAuthorized: async () => {
      const user = await getSessionUser(request, cloudflare.env);
      return user !== null;
    },
  });
}
