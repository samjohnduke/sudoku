import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { createAuth } from "~/lib/auth/auth.server";

function getAuth(context: LoaderFunctionArgs["context"]) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  return createAuth(cloudflare.env.DB, {
    BETTER_AUTH_SECRET: cloudflare.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: cloudflare.env.BETTER_AUTH_URL,
  });
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  return getAuth(context).handler(request);
}

export async function action({ request, context }: ActionFunctionArgs) {
  return getAuth(context).handler(request);
}
