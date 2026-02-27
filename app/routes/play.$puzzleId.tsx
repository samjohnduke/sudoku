import { useState, useCallback, useEffect } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { getDb } from "~/db";
import { puzzles, userStats } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { createAuth } from "~/lib/auth/auth.server";
import { useGame, type SavePayload } from "~/hooks/use-game";
import type { InputMode as GameInputMode } from "~/hooks/use-game";
import { Board } from "~/components/sudoku/board";
import { NumberPad, type InputMode as PadInputMode } from "~/components/sudoku/number-pad";
import type { GameSettings } from "~/components/sudoku/types";
import { DEFAULT_SETTINGS } from "~/components/sudoku/types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { getHint } from "~/lib/hints";
import type { SolveStep, Technique } from "../../lib/sudoku/types";

// ---------------------------------------------------------------------------
// Technique display names
// ---------------------------------------------------------------------------

const TECHNIQUE_DISPLAY_NAMES: Record<Technique, string> = {
  "naked-single": "Naked Single",
  "hidden-single": "Hidden Single",
  "naked-pair": "Naked Pair",
  "naked-triple": "Naked Triple",
  "naked-quad": "Naked Quad",
  "hidden-pair": "Hidden Pair",
  "hidden-triple": "Hidden Triple",
  "hidden-quad": "Hidden Quad",
  "pointing-pairs": "Pointing Pairs",
  "box-line-reduction": "Box/Line Reduction",
  "x-wing": "X-Wing",
  "swordfish": "Swordfish",
  "xy-wing": "XY-Wing",
  "simple-coloring": "Simple Coloring",
  "jellyfish": "Jellyfish",
  "unique-rectangle": "Unique Rectangle",
};

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const db = getDb(cloudflare.env.DB);

  const puzzle = await db
    .select()
    .from(puzzles)
    .where(eq(puzzles.id, params.puzzleId!))
    .get();
  if (!puzzle) throw new Response("Puzzle not found", { status: 404 });

  let progress = null;
  try {
    const auth = createAuth(cloudflare.env.DB, {
      BETTER_AUTH_SECRET: cloudflare.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: cloudflare.env.BETTER_AUTH_URL,
    });
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
      const existing = await db
        .select()
        .from(userStats)
        .where(
          and(
            eq(userStats.userId, session.user.id),
            eq(userStats.puzzleId, params.puzzleId!),
          ),
        )
        .get();
      if (existing && !existing.completedAt) {
        progress = {
          boardState: existing.boardState ?? "",
          notes: existing.notesSnapshot ?? "{}",
          timeSeconds: existing.timeSeconds ?? 0,
        };
      }
    }
  } catch {
    /* not signed in or auth error — fine */
  }

  return {
    puzzle: {
      id: puzzle.id,
      puzzle: puzzle.puzzle,
      solution: puzzle.solution,
      difficultyScore: puzzle.difficultyScore,
      difficultyLabel: puzzle.difficultyLabel,
      techniquesRequired: puzzle.techniquesRequired,
    },
    progress,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePuzzleString(s: string): number[] {
  return s.split("").map((ch) => {
    const n = Number(ch);
    return Number.isNaN(n) || ch === "." ? 0 : n;
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SETTINGS_KEY = "supersudoku_settings";

function loadSettings(): GameSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

const LOCAL_SAVE_PREFIX = "supersudoku_progress_";

/** Map NumberPad modes to useGame modes */
function padModeToGameMode(m: PadInputMode): GameInputMode {
  if (m === "corner") return "note";
  if (m === "center") return "center-note";
  return "value";
}

function gameModeTopadMode(m: GameInputMode): PadInputMode {
  if (m === "note") return "corner";
  if (m === "center-note") return "center";
  return "value";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlayRoute() {
  const { puzzle, progress } = useLoaderData<typeof loader>();

  const [settings] = useState<GameSettings>(loadSettings);

  const initial = parsePuzzleString(puzzle.puzzle);
  const solution = parsePuzzleString(puzzle.solution);

  const handleSave = useCallback(
    (state: SavePayload) => {
      // Try server save; fall back to localStorage
      fetch("/api/game/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }).catch(() => {
        // Not signed in or network error — save locally
        try {
          localStorage.setItem(
            LOCAL_SAVE_PREFIX + state.puzzleId,
            JSON.stringify(state),
          );
        } catch {
          // storage full — ignore
        }
      });
    },
    [],
  );

  const {
    game,
    selectCell,
    enterNumber,
    deleteValue,
    undo,
    redo,
    mode,
    setMode,
  } = useGame({
    puzzleId: puzzle.id,
    initial,
    solution,
    difficultyScore: puzzle.difficultyScore,
    difficultyLabel: puzzle.difficultyLabel,
    settings,
    onSave: handleSave,
    resumeState: progress,
  });

  // --- Hint state ---
  const [hint, setHint] = useState<SolveStep | null>(null);
  const [hintCells, setHintCells] = useState<number[]>([]);

  const handleHint = useCallback(() => {
    const step = getHint(game.current);
    if (step) {
      setHint(step);
      // Convert [row, col] pairs to flat indices
      setHintCells(step.cells.map(([r, c]) => r * 9 + c));
    } else {
      setHint(null);
      setHintCells([]);
    }
  }, [game.current]);

  // Clear hint when user makes a move (detect by board state change)
  const boardKey = game.current.join("");
  useEffect(() => {
    setHint(null);
    setHintCells([]);
  }, [boardKey]);

  // Also try to load localStorage progress on first mount if no server progress
  useEffect(() => {
    if (progress) return;
    try {
      const raw = localStorage.getItem(LOCAL_SAVE_PREFIX + puzzle.id);
      if (raw) {
        // We can't retroactively feed this into useGame after init,
        // so we just leave it for now — the hook will overwrite on first change.
      }
    } catch {
      // ignore
    }
  }, [progress, puzzle.id]);

  const padMode = gameModeTopadMode(mode);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Header bar */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground min-h-[44px] flex items-center">
          &larr; Back
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{puzzle.difficultyLabel}</Badge>
          <span className={cn("tabular-nums font-mono text-sm", game.isComplete && "text-green-600 font-semibold")}>
            {formatTime(game.timer)}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-6 px-2 sm:px-4 py-2 sm:py-4">
        {/* Completion overlay */}
        {game.isComplete ? (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Puzzle Complete!</CardTitle>
              <CardDescription>
                You solved a {puzzle.difficultyLabel.toLowerCase()} puzzle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-mono font-semibold">{formatTime(game.timer)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span>{puzzle.difficultyLabel} ({puzzle.difficultyScore})</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/">Home</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        {/* Board */}
        <Board game={game} settings={settings} onSelectCell={selectCell} hintCells={hintCells} />

        {/* Hint button + hint card */}
        {!game.isComplete && settings.hintsEnabled ? (
          <div className="w-full max-w-md flex flex-col gap-3">
            {!hint ? (
              <Button
                variant="outline"
                size="sm"
                className="self-center"
                onClick={handleHint}
              >
                Hint
              </Button>
            ) : null}
            {hint ? (
              <Card className="border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {TECHNIQUE_DISPLAY_NAMES[hint.technique]}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {hint.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 pb-3">
                  <Link
                    to={`/bible/${hint.technique}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Learn this technique &rarr;
                  </Link>
                </CardFooter>
              </Card>
            ) : null}
          </div>
        ) : null}

        {/* Number Pad */}
        {!game.isComplete ? (
          <NumberPad
            onNumber={enterNumber}
            onDelete={deleteValue}
            mode={padMode}
            onModeChange={(m) => setMode(padModeToGameMode(m))}
            onUndo={undo}
            onRedo={redo}
          />
        ) : null}
      </main>
    </div>
  );
}
