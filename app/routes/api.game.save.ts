import type { ActionFunctionArgs } from "react-router";
import { getDb } from "~/db";
import { userStats } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { apiError, apiSuccess } from "~/lib/api";
import { getSessionUser } from "~/lib/auth/auth.server";
import { getMetrics, trackEvent, timedQuery } from "~/lib/metrics";

export interface SaveGameBody {
  puzzleId: string;
  boardState: string;
  notesSnapshot: string;
  timeSeconds: number;
  completed: boolean;
  /** ISO timestamp from the client. When present (offline sync), the server
   *  will only write if this is newer than the existing `updated_at`. */
  savedAt?: string;
}

export function validateSaveBody(data: unknown): data is SaveGameBody {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (
    typeof obj.puzzleId !== "string" ||
    obj.puzzleId.length === 0 ||
    typeof obj.boardState !== "string" ||
    typeof obj.notesSnapshot !== "string" ||
    typeof obj.timeSeconds !== "number" ||
    !Number.isFinite(obj.timeSeconds) ||
    obj.timeSeconds < 0 ||
    typeof obj.completed !== "boolean"
  ) {
    return false;
  }
  if (obj.savedAt !== undefined && typeof obj.savedAt !== "string") {
    return false;
  }
  return true;
}

/**
 * Determines whether an offline sync save should be skipped.
 * Returns true if the existing server record is newer or the save would
 * un-complete a finished puzzle.
 */
export function shouldSkipSave(
  body: SaveGameBody,
  existing: { completedAt: string | null; updatedAt: string | null },
): boolean {
  if (!body.savedAt) return false;
  // Never overwrite a completed puzzle with in-progress data
  if (existing.completedAt && !body.completed) return true;
  // Skip if server has a newer update
  if (existing.updatedAt && body.savedAt <= existing.updatedAt) return true;
  return false;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const db = getDb(cloudflare.env.DB);
  const metrics = getMetrics(cloudflare.env);

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

  const now = new Date().toISOString();

  const existing = await timedQuery(metrics, "select", "user_stats", () =>
    db
      .select()
      .from(userStats)
      .where(
        and(
          eq(userStats.userId, user.id),
          eq(userStats.puzzleId, body.puzzleId),
        ),
      )
      .get(),
  );

  if (existing) {
    if (shouldSkipSave(body, existing)) {
      return apiSuccess({ skipped: true });
    }

    await timedQuery(metrics, "update", "user_stats", () =>
      db
        .update(userStats)
        .set({
          boardState: body.boardState,
          notesSnapshot: body.notesSnapshot,
          timeSeconds: body.timeSeconds,
          completedAt: body.completed ? new Date().toISOString() : null,
          updatedAt: now,
        })
        .where(eq(userStats.id, existing.id)),
    );
  } else {
    await timedQuery(metrics, "insert", "user_stats", () =>
      db.insert(userStats).values({
        id: crypto.randomUUID(),
        userId: user.id,
        puzzleId: body.puzzleId,
        startedAt: now,
        boardState: body.boardState,
        notesSnapshot: body.notesSnapshot,
        timeSeconds: body.timeSeconds,
        completedAt: body.completed ? new Date().toISOString() : null,
        updatedAt: now,
      }),
    );
    trackEvent(metrics, "game_start", { userId: user.id });
  }

  trackEvent(metrics, "game_save", { userId: user.id });
  if (body.completed) {
    trackEvent(metrics, "game_complete", {
      userId: user.id,
      value: body.timeSeconds,
    });
  }

  return apiSuccess();
}
