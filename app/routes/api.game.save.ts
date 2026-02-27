import type { ActionFunctionArgs } from "react-router";
import { getDb } from "~/db";
import { userStats } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { createAuth } from "~/lib/auth/auth.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const db = getDb(cloudflare.env.DB);
  const body = await request.json();

  const auth = createAuth(cloudflare.env.DB, {
    BETTER_AUTH_SECRET: cloudflare.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: cloudflare.env.BETTER_AUTH_URL,
  });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db
    .select()
    .from(userStats)
    .where(
      and(
        eq(userStats.userId, session.user.id),
        eq(userStats.puzzleId, body.puzzleId),
      ),
    )
    .get();

  if (existing) {
    await db
      .update(userStats)
      .set({
        boardState: body.boardState,
        notesSnapshot: body.notesSnapshot,
        timeSeconds: body.timeSeconds,
        completedAt: body.completed ? new Date().toISOString() : null,
      })
      .where(eq(userStats.id, existing.id));
  } else {
    await db.insert(userStats).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      puzzleId: body.puzzleId,
      startedAt: new Date().toISOString(),
      boardState: body.boardState,
      notesSnapshot: body.notesSnapshot,
      timeSeconds: body.timeSeconds,
      completedAt: body.completed ? new Date().toISOString() : null,
    });
  }

  return Response.json({ ok: true });
}
