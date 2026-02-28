import type { LoaderFunctionArgs } from "react-router";
import { getDb } from "~/db";
import { puzzles } from "~/db/schema";

export async function loader({ context }: LoaderFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const db = getDb(cloudflare.env.DB);

  const allPuzzles = await db
    .select({
      id: puzzles.id,
      puzzle: puzzles.puzzle,
      solution: puzzles.solution,
      difficultyScore: puzzles.difficultyScore,
      difficultyLabel: puzzles.difficultyLabel,
      techniquesRequired: puzzles.techniquesRequired,
    })
    .from(puzzles)
    .all();

  return Response.json(allPuzzles, {
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  });
}
