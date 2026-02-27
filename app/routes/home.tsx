import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { getDb } from "~/db";
import { puzzles } from "~/db/schema";
import { sql } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";

const DIFFICULTY_LABELS = [
  { label: "Beginner", position: 0 },
  { label: "Easy", position: 25 },
  { label: "Medium", position: 50 },
  { label: "Hard", position: 75 },
  { label: "Expert", position: 100 },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SUPERSudoku" },
    {
      name: "description",
      content: "A sudoku app that teaches you solving techniques",
    },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
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

  const totalCount = counts.reduce((sum, row) => sum + row.count, 0);

  return { counts, totalCount };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { counts, totalCount } = loaderData;
  const [range, setRange] = useState([20, 50]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleNewPuzzle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/puzzle/random?min=${range[0]}&max=${range[1]}`
      );
      if (!res.ok) {
        const data = await res.json();
        setError(
          (data as { error?: string }).error || "No puzzles found in this range"
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
    <div className="flex min-h-dvh items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center gap-8 px-4 sm:px-6">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
            SUPERSudoku
          </h1>
          <p className="text-lg text-muted-foreground">
            Pick your difficulty and play.
          </p>
        </div>

        <div className="w-full space-y-3">
          <Slider
            value={range}
            onValueChange={setRange}
            min={0}
            max={100}
            step={1}
          />
          <div className="relative h-6 w-full">
            {DIFFICULTY_LABELS.map(({ label, position }) => (
              <span
                key={label}
                className="absolute -translate-x-1/2 text-xs text-muted-foreground"
                style={{ left: `${position}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full text-lg"
          onClick={handleNewPuzzle}
          disabled={loading}
        >
          {loading ? "Finding puzzle..." : "New Puzzle"}
        </Button>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {totalCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {totalCount.toLocaleString()} puzzles available
          </p>
        ) : null}
      </div>
    </div>
  );
}
