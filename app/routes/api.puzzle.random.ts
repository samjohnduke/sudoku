import type { LoaderFunctionArgs } from "react-router";
import { getDb } from "~/db";
import { puzzles } from "~/db/schema";
import { and, gte, lte, sql } from "drizzle-orm";
import { apiError } from "~/lib/api";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const url = new URL(request.url);
  const min = parseFloat(url.searchParams.get("min") ?? "0");
  const max = parseFloat(url.searchParams.get("max") ?? "100");

  const db = getDb(cloudflare.env.DB);
  const puzzle = await db
    .select({ id: puzzles.id })
    .from(puzzles)
    .where(
      and(
        gte(puzzles.difficultyScore, min),
        lte(puzzles.difficultyScore, max)
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(1)
    .get();

  if (!puzzle) {
    return apiError("No puzzles in range", 404);
  }

  return Response.json({ puzzleId: puzzle.id });
}
