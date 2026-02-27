import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { drizzle } from "drizzle-orm/d1";

export function createAuth(
  db: D1Database,
  env: { BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
) {
  const database = drizzle(db);

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(database, { provider: "sqlite" }),
    plugins: [
      passkey({
        rpID: new URL(env.BETTER_AUTH_URL).hostname,
        rpName: "SUPERSudoku",
        origin: env.BETTER_AUTH_URL,
      }),
    ],
    trustedOrigins: [env.BETTER_AUTH_URL],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    advanced: {
      defaultCookieAttributes: {
        secure: true,
        httpOnly: true,
        sameSite: "lax",
      },
    },
  });
}
