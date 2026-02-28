import type { ActionFunctionArgs } from "react-router";
import { getDb } from "~/db";
import { userStats, userSettings } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { createAuth } from "~/lib/auth/auth.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const db = getDb(cloudflare.env.DB);

  const auth = createAuth(cloudflare.env.DB, {
    BETTER_AUTH_SECRET: cloudflare.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: cloudflare.env.BETTER_AUTH_URL,
  });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const userId = session.user.id;

  // Migrate current game progress
  if (body.currentGame) {
    const { puzzleId, boardState, notesSnapshot, timeSeconds } =
      body.currentGame;
    const existing = await db
      .select()
      .from(userStats)
      .where(and(eq(userStats.userId, userId), eq(userStats.puzzleId, puzzleId)))
      .get();

    // Only insert if there is no existing server record (don't overwrite newer data)
    if (!existing) {
      await db.insert(userStats).values({
        id: crypto.randomUUID(),
        userId,
        puzzleId,
        startedAt: new Date().toISOString(),
        boardState,
        notesSnapshot,
        timeSeconds,
      });
    }
  }

  // Migrate settings
  if (body.settings) {
    const existing = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .get();

    if (existing) {
      await db
        .update(userSettings)
        .set({ settings: body.settings })
        .where(eq(userSettings.id, existing.id));
    } else {
      await db.insert(userSettings).values({
        id: crypto.randomUUID(),
        userId,
        settings: body.settings,
      });
    }
  }

  return Response.json({ ok: true });
}
