import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "~/db/schema";

/**
 * D1 only accepts strings, numbers, null, and ArrayBuffer as bind params.
 * Better Auth passes Date objects and booleans which D1 rejects.
 * This proxy wraps D1Database.prepare().bind() to convert them.
 */
function wrapD1(db: D1Database): D1Database {
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === "prepare") {
        return (sql: string) => {
          const stmt = target.prepare(sql);
          return new Proxy(stmt, {
            get(stmtTarget, stmtProp, stmtReceiver) {
              if (stmtProp === "bind") {
                return (...args: unknown[]) => {
                  const converted = args.map((a) => {
                    if (a instanceof Date) return a.toISOString();
                    if (typeof a === "boolean") return a ? 1 : 0;
                    return a;
                  });
                  return stmtTarget.bind(...converted);
                };
              }
              const val = Reflect.get(stmtTarget, stmtProp, stmtReceiver);
              return typeof val === "function" ? val.bind(stmtTarget) : val;
            },
          });
        };
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === "function" ? val.bind(target) : val;
    },
  });
}

/**
 * Helper to get the current session user from a request.
 * Returns the user object or null if not signed in.
 */
export async function getSessionUser(
  request: Request,
  env: Env,
): Promise<{ id: string; name: string | null } | null> {
  try {
    const auth = createAuth(env.DB, {
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    });
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user
      ? { id: session.user.id, name: session.user.name }
      : null;
  } catch {
    return null;
  }
}

export function createAuth(
  db: D1Database,
  env: { BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
) {
  const wrappedDb = wrapD1(db);
  const database = drizzle(wrappedDb, { schema });

  const isSecure = env.BETTER_AUTH_URL.startsWith("https://");

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(database, { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      passkey({
        rpID: new URL(env.BETTER_AUTH_URL).hostname,
        rpName: "Super Sudoku",
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
        secure: isSecure,
        httpOnly: true,
        sameSite: "lax",
      },
    },
  });
}
