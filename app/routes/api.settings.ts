import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getDb } from "~/db";
import { userSettings } from "~/db/schema";
import { eq } from "drizzle-orm";
import { apiError, apiSuccess } from "~/lib/api";
import { getSessionUser } from "~/lib/auth/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const user = await getSessionUser(request, cloudflare.env);
  if (!user) {
    return apiError("Unauthorized", 401);
  }

  const db = getDb(cloudflare.env.DB);
  const row = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .get();

  return Response.json({ settings: row ? JSON.parse(row.settings) : null });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const user = await getSessionUser(request, cloudflare.env);
  if (!user) {
    return apiError("Unauthorized", 401);
  }

  const body = (await request.json()) as { settings: Record<string, unknown> };
  const db = getDb(cloudflare.env.DB);
  const settingsJson = JSON.stringify(body.settings);

  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .get();

  if (existing) {
    await db
      .update(userSettings)
      .set({ settings: settingsJson })
      .where(eq(userSettings.id, existing.id));
  } else {
    await db.insert(userSettings).values({
      id: crypto.randomUUID(),
      userId: user.id,
      settings: settingsJson,
    });
  }

  return apiSuccess();
}
