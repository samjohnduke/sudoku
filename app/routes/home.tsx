import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { Play } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Logo } from "~/components/logo";
import { Button } from "~/components/ui/button";
import { getDb } from "~/db";
import { puzzles, userStats } from "~/db/schema";
import { getSessionUser } from "~/lib/auth/auth.server";
import { getMetrics, timedQuery } from "~/lib/metrics";
import { cn, formatTime, DIFFICULTIES, DIFFICULTY_RANGES, DATA_CACHE_NAME } from "~/lib/utils";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Super Sudoku" },
    {
      name: "description",
      content: "A sudoku app that teaches you solving techniques",
    },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const db = getDb(cloudflare.env.DB);
  const metrics = getMetrics(cloudflare.env);

  const counts = await timedQuery(metrics, "select", "puzzles", () =>
    db
      .select({
        difficultyLabel: puzzles.difficultyLabel,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(puzzles)
      .groupBy(puzzles.difficultyLabel)
      .all(),
  );

  // Check for in-progress game if signed in
  let inProgress: { puzzleId: string; difficultyLabel: string; timeSeconds: number | null } | null = null;
  const user = await getSessionUser(request, cloudflare.env);
  if (user) {
    const row = await timedQuery(metrics, "select", "user_stats", () =>
      db
        .select({
          puzzleId: userStats.puzzleId,
          difficultyLabel: puzzles.difficultyLabel,
          timeSeconds: userStats.timeSeconds,
        })
        .from(userStats)
        .innerJoin(puzzles, eq(userStats.puzzleId, puzzles.id))
        .where(
          and(
            eq(userStats.userId, user.id),
            isNull(userStats.completedAt),
          ),
        )
        .orderBy(desc(userStats.startedAt))
        .limit(1)
        .get(),
    );
    if (row) inProgress = row;
  }

  return { counts, inProgress };
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  try {
    return await serverLoader();
  } catch {
    // Offline or server error — render with empty data
    return { counts: [], inProgress: null };
  }
}
clientLoader.hydrate = true as const;

interface CachedPuzzle {
  id: string;
  difficultyScore: number;
}

async function getOfflineRandomPuzzle(min: number, max: number): Promise<string | null> {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = await cache.match("/api/puzzles/all");
    if (!response) return null;
    const allPuzzles = (await response.json()) as CachedPuzzle[];
    const matching = allPuzzles.filter(
      (p) => p.difficultyScore >= min && p.difficultyScore <= max
    );
    if (matching.length === 0) return null;
    const pick = matching[Math.floor(Math.random() * matching.length)];
    return pick.id;
  } catch {
    return null;
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { counts, inProgress } = loaderData;
  const [selected, setSelected] = useState<string>("Medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleNewPuzzle() {
    setLoading(true);
    setError(null);
    const [min, max] = DIFFICULTY_RANGES[selected];
    try {
      const res = await fetch(`/api/puzzle/random?min=${min}&max=${max}`);
      if (!res.ok) {
        const data = await res.json();
        if ((data as { error?: string }).error === "offline") {
          const offlineId = await getOfflineRandomPuzzle(min, max);
          if (offlineId) {
            navigate(`/play/${offlineId}`);
            return;
          }
        }
        setError(
          (data as { error?: string }).error || "No puzzles found for this difficulty"
        );
        return;
      }
      const data = (await res.json()) as { puzzleId: string };
      navigate(`/play/${data.puzzleId}`);
    } catch {
      const offlineId = await getOfflineRandomPuzzle(min, max);
      if (offlineId) {
        navigate(`/play/${offlineId}`);
        return;
      }
      setError("You're offline and no cached puzzles are available.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center pb-20 sm:pb-0">
      <div className="flex w-full max-w-sm flex-col items-center gap-10 px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Logo size={56} className="text-primary" />
          <div className="text-center">
            <h1 className="font-serif italic text-3xl sm:text-4xl text-foreground leading-tight">
              super sudoku
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 tracking-wide uppercase">Pick your challenge</p>
          </div>
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

        {/* Difficulty selector */}
        <div
          className="w-full animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex bg-secondary rounded-xl p-1">
            {DIFFICULTIES.map((diff) => {
              const isSelected = selected === diff;
              return (
                <button
                  key={diff}
                  onClick={() => setSelected(diff)}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-medium rounded-lg transition-all duration-200",
                    isSelected
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {diff}
                </button>
              );
            })}
          </div>
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
