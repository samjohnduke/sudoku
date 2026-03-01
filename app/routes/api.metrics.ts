import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { handleMetricsQuery } from "~/lib/metrics-query";
import { getSessionUser } from "~/lib/auth/auth.server";

const DATASET = "supersudoku_metrics";

function handler(request: Request, context: LoaderFunctionArgs["context"]) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const env = cloudflare.env;

  return handleMetricsQuery(request, env, {
    dataset: DATASET,
    maxRows: 10_000,
    // Fall back to session auth when no API key is provided
    isAuthorized: async () => {
      const user = await getSessionUser(request, env);
      return user !== null;
    },
  });
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  return handler(request, context);
}

export async function action({ request, context }: ActionFunctionArgs) {
  return handler(request, context);
}
