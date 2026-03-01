import { and, eq } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";
import type { ClientLoaderFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useNavigate, useParams } from "react-router";
import { Board } from "~/components/sudoku/board";
import { NumberPad, type InputMode as PadInputMode } from "~/components/sudoku/number-pad";
import type { GameSettings } from "~/components/sudoku/types";
import { DEFAULT_SETTINGS } from "~/components/sudoku/types";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getDb } from "~/db";
import { puzzles, userStats } from "~/db/schema";
import type { InputMode as GameInputMode } from "~/hooks/use-game";
import { useGame, type SavePayload } from "~/hooks/use-game";
import { getSessionUser } from "~/lib/auth/auth.server";
import { getHint } from "~/lib/hints";
import { cn, formatTime, DIFFICULTY_RANGES, DATA_CACHE_NAME } from "~/lib/utils";
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
  const user = await getSessionUser(request, cloudflare.env);
  if (user) {
    const existing = await db
      .select()
      .from(userStats)
      .where(
        and(
          eq(userStats.userId, user.id),
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

const LOCAL_SAVE_PREFIX = "super_sudoku_progress_";

export async function clientLoader({ params, serverLoader }: ClientLoaderFunctionArgs) {
  try {
    return await serverLoader<typeof loader>();
  } catch {
    // Offline — load puzzle from SW cache, progress from localStorage
    const puzzleId = params.puzzleId!;
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = await cache.match("/api/puzzles/all");
    if (!response) throw new Response("Puzzle not available offline", { status: 404 });

    const allPuzzles = (await response.json()) as GameViewProps["puzzle"][];
    const puzzle = allPuzzles.find((p) => p.id === puzzleId);
    if (!puzzle) throw new Response("Puzzle not found in cache", { status: 404 });

    // Try to restore progress from localStorage
    let progress = null;
    try {
      const raw = localStorage.getItem(LOCAL_SAVE_PREFIX + puzzleId);
      if (raw) {
        const saved = JSON.parse(raw) as SavePayload;
        progress = {
          boardState: saved.boardState,
          notes: saved.notesSnapshot,
          timeSeconds: saved.timeSeconds,
        };
      }
    } catch {
      // ignore bad data
    }

    return { puzzle, progress };
  }
}
clientLoader.hydrate = true as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePuzzleString(s: string): number[] {
  return s.split("").map((ch) => {
    const n = Number(ch);
    return Number.isNaN(n) || ch === "." ? 0 : n;
  });
}

const SETTINGS_KEY = "super_sudoku_settings";

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
// GameView — reusable game UI (used by both PlayRoute and ErrorBoundary)
// ---------------------------------------------------------------------------

interface GameViewProps {
  puzzle: {
    id: string;
    puzzle: string;
    solution: string;
    difficultyScore: number;
    difficultyLabel: string;
    techniquesRequired: string;
  };
  progress: { boardState: string; notes: string; timeSeconds: number } | null;
}

function GameView({ puzzle, progress }: GameViewProps) {
  const navigate = useNavigate();
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

  // Resolve resume state: prefer server progress, fall back to localStorage
  const [resumeState] = useState(() => {
    if (progress) return progress;
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(LOCAL_SAVE_PREFIX + puzzle.id);
      if (raw) {
        const saved = JSON.parse(raw) as SavePayload;
        return {
          boardState: saved.boardState,
          notes: saved.notesSnapshot,
          timeSeconds: saved.timeSeconds,
        };
      }
    } catch {
      // ignore bad data
    }
    return null;
  });

  const {
    game,
    selectCell,
    enterNumber,
    deleteValue,
    undo,
    redo,
    reset,
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
    resumeState,
  });

  // --- Hint state ---
  const [hint, setHint] = useState<SolveStep | null>(null);
  const [hintCells, setHintCells] = useState<number[]>([]);

  const handleHint = useCallback(() => {
    const step = getHint(initial, game.current, solution);
    if (step) {
      setHint(step);
      // Convert [row, col] pairs to flat indices
      setHintCells(step.cells.map(([r, c]) => r * 9 + c));
    } else {
      setHint(null);
      setHintCells([]);
    }
  }, [initial, game.current, solution]);

  // Clear hint when user makes a move (detect by board state change)
  const boardKey = game.current.join("");
  useEffect(() => {
    setHint(null);
    setHintCells([]);
  }, [boardKey]);

  const padMode = gameModeTopadMode(mode);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Floating info bar */}
      <header className="flex items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
        >
          &larr; Back
        </Link>
        <span className="text-sm text-muted-foreground">{puzzle.difficultyLabel}</span>
        <span
          className={cn(
            "font-mono text-sm tabular-nums",
            game.isComplete && "text-primary font-semibold"
          )}
        >
          {formatTime(game.timer)}
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-between px-3 pb-6 sm:justify-center sm:gap-6 sm:pb-4">
        {/* Completion overlay */}
        {game.isComplete ? (
          <Card className="w-full max-w-md border-border/50 animate-slide-up mb-4">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Puzzle Complete</CardTitle>
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
              <Button asChild variant="outline" className="flex-1 rounded-xl">
                <Link to="/">Home</Link>
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={async () => {
                  const range = DIFFICULTY_RANGES[puzzle.difficultyLabel];
                  if (!range) {
                    navigate("/");
                    return;
                  }
                  try {
                    const res = await fetch(`/api/puzzle/random?min=${range[0]}&max=${range[1]}`);
                    if (res.ok) {
                      const data = (await res.json()) as { puzzleId: string };
                      navigate(`/play/${data.puzzleId}`);
                      return;
                    }
                  } catch {
                    // fall through to home
                  }
                  navigate("/");
                }}
              >
                New Puzzle
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        {/* Board */}
        <div className="w-full max-w-md flex-shrink-0">
          <Board game={game} settings={settings} onSelectCell={selectCell} hintCells={hintCells} />
        </div>

        {/* Bottom section: hints + number pad */}
        {!game.isComplete ? (
          <div className="w-full max-w-md flex flex-col gap-3 mt-3 sm:mt-0">
            {/* Hint area */}
            {settings.hintsEnabled ? (
              <>
                {!hint ? (
                  <button
                    onClick={handleHint}
                    className="self-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Show hint
                  </button>
                ) : null}
                {hint ? (
                  <div className="px-3 py-2.5 rounded-xl border border-amber-300/50 dark:border-amber-600/30 bg-amber-50/50 dark:bg-amber-950/20 animate-fade-in">
                    <p className="text-sm font-medium">
                      {TECHNIQUE_DISPLAY_NAMES[hint.technique]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hint.description}
                    </p>
                    <Link
                      to={`/bible/${hint.technique}`}
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      Learn this technique
                    </Link>
                  </div>
                ) : null}
              </>
            ) : null}

            {/* Number Pad */}
            <NumberPad
              onNumber={enterNumber}
              onDelete={deleteValue}
              mode={padMode}
              onModeChange={(m) => setMode(padModeToGameMode(m))}
              onUndo={undo}
              onRedo={redo}
            />

            {/* Reset button */}
            <button
              onClick={() => {
                if (window.confirm("Reset this puzzle? All progress will be lost.")) {
                  reset();
                }
              }}
              className="self-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Reset puzzle
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export — loads puzzle data from the loader
// ---------------------------------------------------------------------------

export default function PlayRoute() {
  const { puzzle, progress } = useLoaderData<typeof loader>();
  return <GameView puzzle={puzzle} progress={progress} />;
}

// ---------------------------------------------------------------------------
// ErrorBoundary — offline fallback, loads puzzle from SW cache
// ---------------------------------------------------------------------------

export function ErrorBoundary() {
  const { puzzleId } = useParams();
  const [puzzle, setPuzzle] = useState<GameViewProps["puzzle"] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function loadFromCache() {
      try {
        const cache = await caches.open(DATA_CACHE_NAME);
        const response = await cache.match("/api/puzzles/all");
        if (!response) {
          setLoadError(true);
          return;
        }
        const allPuzzles = (await response.json()) as GameViewProps["puzzle"][];
        const found = allPuzzles.find((p) => p.id === puzzleId);
        if (found) setPuzzle(found);
        else setLoadError(true);
      } catch {
        setLoadError(true);
      }
    }
    loadFromCache();
  }, [puzzleId]);

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-dvh">
        <div className="text-center px-6">
          <h1 className="text-xl font-semibold mb-2">Puzzle Unavailable</h1>
          <p className="text-muted-foreground mb-4">
            This puzzle isn&apos;t available offline.
          </p>
          <Link to="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-dvh">
        <p className="text-muted-foreground">Loading puzzle...</p>
      </div>
    );
  }

  return <GameView puzzle={puzzle} progress={null} />;
}
