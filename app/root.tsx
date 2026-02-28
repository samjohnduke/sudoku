import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { createAuth } from "~/lib/auth/auth.server";
import { Header } from "~/components/layout/header";
import "./app.css";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  let user: { id: string; name: string | null } | null = null;
  try {
    const auth = createAuth(cloudflare.env.DB, {
      BETTER_AUTH_SECRET: cloudflare.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: cloudflare.env.BETTER_AUTH_URL,
    });
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
      user = { id: session.user.id, name: session.user.name };
    }
  } catch {
    /* not signed in */
  }
  return { user };
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <Outlet context={{ user }} />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
