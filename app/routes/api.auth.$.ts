import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { createAuth } from "~/lib/auth/auth.server";
import { getMetrics, trackEvent } from "~/lib/metrics";

function getAuth(context: LoaderFunctionArgs["context"]) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  return createAuth(cloudflare.env.DB, {
    BETTER_AUTH_SECRET: cloudflare.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: cloudflare.env.BETTER_AUTH_URL,
  });
}

/** Detect auth event type from the request URL path. */
function getAuthEventName(url: URL): string | null {
  const path = url.pathname;
  if (path.includes("/sign-in")) return "login";
  if (path.includes("/sign-up")) return "signup";
  if (path.includes("/sign-out")) return "signout";
  return null;
}

async function handleAuth(
  request: Request,
  context: LoaderFunctionArgs["context"],
) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const response = await getAuth(context).handler(request);

  const eventName = getAuthEventName(new URL(request.url));
  if (eventName && response.ok) {
    trackEvent(getMetrics(cloudflare.env), eventName);
  }

  return response;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  return handleAuth(request, context);
}

export async function action({ request, context }: ActionFunctionArgs) {
  return handleAuth(request, context);
}
