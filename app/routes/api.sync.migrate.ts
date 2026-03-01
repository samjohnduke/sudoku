import type { ActionFunctionArgs } from "react-router";
import { getDb } from "~/db";
import { userStats, userSettings } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { apiError, apiSuccess } from "~/lib/api";
import { getSessionUser } from "~/lib/auth/auth.server";

interface MigrateCurrentGame {
  puzzleId: string;
  boardState: string;
  notesSnapshot: string;
  timeSeconds: number;
}

interface MigrateBody {
  currentGame?: MigrateCurrentGame;
  settings?: string;
}

function validateMigrateBody(data: unknown): data is MigrateBody {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (obj.currentGame !== undefined) {
    if (typeof obj.currentGame !== "object" || obj.currentGame === null) return false;
    const game = obj.currentGame as Record<string, unknown>;
    if (
      typeof game.puzzleId !== "string" ||
      game.puzzleId.length === 0 ||
      typeof game.boardState !== "string" ||
      typeof game.notesSnapshot !== "string" ||
      typeof game.timeSeconds !== "number" ||
      !Number.isFinite(game.timeSeconds) ||
      game.timeSeconds < 0
    ) {
      return false;
    }
  }

  if (obj.settings !== undefined && typeof obj.settings !== "string") {
    return false;
  }

  return true;
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

  if (!validateMigrateBody(body)) {
    return apiError(
      "Invalid request body: expected optional currentGame ({ puzzleId, boardState, notesSnapshot, timeSeconds }) and optional settings (string)",
      400,
    );
  }

  const userId = user.id;

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

  return apiSuccess();
}
