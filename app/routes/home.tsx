import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { getDb } from "~/db";
import { puzzles, userStats } from "~/db/schema";
import { sql, eq, and, isNull, desc } from "drizzle-orm";
import { createAuth } from "~/lib/auth/auth.server";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Play } from "lucide-react";

const DIFFICULTIES = ["Beginner", "Easy", "Medium", "Hard", "Expert"] as const;

const DIFFICULTY_RANGES: Record<string, [number, number]> = {
  Beginner: [0, 15],
  Easy: [15, 35],
  Medium: [35, 60],
  Hard: [60, 80],
  Expert: [80, 100],
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SUPERSudoku" },
    {
      name: "description",
      content: "A sudoku app that teaches you solving techniques",
    },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const db = getDb(cloudflare.env.DB);

  const counts = await db
    .select({
      difficultyLabel: puzzles.difficultyLabel,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(puzzles)
    .groupBy(puzzles.difficultyLabel)
    .all();

  // Check for in-progress game if signed in
  let inProgress: { puzzleId: string; difficultyLabel: string; timeSeconds: number | null } | null = null;
  try {
    const auth = createAuth(cloudflare.env.DB, {
      BETTER_AUTH_SECRET: cloudflare.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: cloudflare.env.BETTER_AUTH_URL,
    });
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
      const row = await db
        .select({
          puzzleId: userStats.puzzleId,
          difficultyLabel: puzzles.difficultyLabel,
          timeSeconds: userStats.timeSeconds,
        })
        .from(userStats)
        .innerJoin(puzzles, eq(userStats.puzzleId, puzzles.id))
        .where(
          and(
            eq(userStats.userId, session.user.id),
            isNull(userStats.completedAt),
          ),
        )
        .orderBy(desc(userStats.startedAt))
        .limit(1)
        .get();
      if (row) inProgress = row;
    }
  } catch {
    // Not signed in — fine
  }

  return { counts, inProgress };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { counts, inProgress } = loaderData;
  const [selected, setSelected] = useState<string>("Medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if selected difficulty has puzzles
  const availableDifficulties = new Set(counts.map((c) => c.difficultyLabel));

  async function handleNewPuzzle() {
    setLoading(true);
    setError(null);
    const [min, max] = DIFFICULTY_RANGES[selected];
    try {
      const res = await fetch(`/api/puzzle/random?min=${min}&max=${max}`);
      if (!res.ok) {
        const data = await res.json();
        setError(
          (data as { error?: string }).error || "No puzzles found for this difficulty"
        );
        return;
      }
      const data = (await res.json()) as { puzzleId: string };
      navigate(`/play/${data.puzzleId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center pb-20 sm:pb-0">
      <div className="flex w-full max-w-sm flex-col items-center gap-10 px-6">
        {/* Logo */}
        <div className="flex flex-col items-center animate-fade-in">
          <h1 className="font-serif italic text-4xl sm:text-5xl text-foreground leading-tight text-center">
            supersudoku
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pick your challenge</p>
        </div>

        {/* Resume card */}
        {inProgress ? (
          <button
            onClick={() => navigate(`/play/${inProgress.puzzleId}`)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
              "bg-primary/8 border border-primary/15 transition-colors hover:bg-primary/12",
              "animate-fade-in"
            )}
            style={{ animationDelay: "50ms" }}
          >
            <Play className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Resume puzzle</p>
              <p className="text-xs text-muted-foreground">
                {inProgress.difficultyLabel}
                {inProgress.timeSeconds != null ? ` · ${formatTime(inProgress.timeSeconds)}` : ""}
              </p>
            </div>
          </button>
        ) : null}

        {/* Difficulty chips */}
        <div
          className="flex flex-wrap justify-center gap-2 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          {DIFFICULTIES.map((diff) => {
            const isAvailable = availableDifficulties.has(diff);
            const isSelected = selected === diff;
            return (
              <button
                key={diff}
                onClick={() => setSelected(diff)}
                disabled={!isAvailable}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isAvailable
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      : "bg-muted text-muted-foreground/50 cursor-not-allowed",
                )}
              >
                {diff}
              </button>
            );
          })}
        </div>

        {/* New Puzzle button */}
        <div className="w-full animate-fade-in" style={{ animationDelay: "150ms" }}>
          <Button
            size="lg"
            className="w-full text-base font-semibold h-12 rounded-xl"
            onClick={handleNewPuzzle}
            disabled={loading}
          >
            {loading ? "Finding puzzle..." : "New Puzzle"}
          </Button>

          {error ? (
            <p className="text-sm text-destructive text-center mt-3">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
