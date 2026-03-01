import type { ActionFunctionArgs } from "react-router";
import { getDb } from "~/db";
import { userStats } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { apiError, apiSuccess } from "~/lib/api";
import { getSessionUser } from "~/lib/auth/auth.server";

interface SaveGameBody {
  puzzleId: string;
  boardState: string;
  notesSnapshot: string;
  timeSeconds: number;
  completed: boolean;
}

function validateSaveBody(data: unknown): data is SaveGameBody {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.puzzleId === "string" &&
    obj.puzzleId.length > 0 &&
    typeof obj.boardState === "string" &&
    typeof obj.notesSnapshot === "string" &&
    typeof obj.timeSeconds === "number" &&
    Number.isFinite(obj.timeSeconds) &&
    obj.timeSeconds >= 0 &&
    typeof obj.completed === "boolean"
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const db = getDb(cloudflare.env.DB);

  const user = await getSessionUser(request, cloudflare.env);
  if (!user) {
    return apiError("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  if (!validateSaveBody(body)) {
    return apiError(
      "Invalid request body: expected puzzleId (string), boardState (string), notesSnapshot (string), timeSeconds (number >= 0), completed (boolean)",
      400,
    );
  }

  const existing = await db
    .select()
    .from(userStats)
    .where(
      and(
        eq(userStats.userId, user.id),
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
      userId: user.id,
      puzzleId: body.puzzleId,
      startedAt: new Date().toISOString(),
      boardState: body.boardState,
      notesSnapshot: body.notesSnapshot,
      timeSeconds: body.timeSeconds,
      completedAt: body.completed ? new Date().toISOString() : null,
    });
  }

  return apiSuccess();
}
