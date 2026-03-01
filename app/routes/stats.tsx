import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { memo, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getDb } from "~/db";
import { puzzles, userStats } from "~/db/schema";
import { getSessionUser } from "~/lib/auth/auth.server";
import { formatTime } from "~/lib/utils";
import type { Route } from "./+types/stats";

// ── Types ──

interface CompletedGame {
  timeSeconds: number;
  completedAt: string;
  difficultyLabel: string;
  puzzleId: string;
}

interface InProgressGame {
  puzzleId: string;
  timeSeconds: number | null;
  startedAt: string;
  difficultyLabel: string;
}

interface StatsData {
  totalCompleted: number;
  averageTime: number;
  bestTime: number;
  recentGames: CompletedGame[];
  bestTimes: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  currentInProgress: InProgressGame | null;
}

// ── Helpers ──

const DIFFICULTY_ORDER = ["Beginner", "Easy", "Medium", "Hard", "Expert"];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "#6b9080",
  Easy: "#5b7fa5",
  Medium: "#8a7a5e",
  Hard: "#b07050",
  Expert: "#c25555",
};

// ── Loader ──

export function meta() {
  return [{ title: "Stats — Super Sudoku" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };

  const user = await getSessionUser(request, cloudflare.env);
  if (!user) {
    return { stats: null, signedIn: false };
  }

  try {
    const db = getDb(cloudflare.env.DB);

    // Completed games with difficulty labels
    const completed = await db
      .select({
        timeSeconds: userStats.timeSeconds,
        completedAt: userStats.completedAt,
        difficultyLabel: puzzles.difficultyLabel,
        puzzleId: userStats.puzzleId,
      })
      .from(userStats)
      .innerJoin(puzzles, eq(userStats.puzzleId, puzzles.id))
      .where(
        and(
          eq(userStats.userId, user.id),
          isNotNull(userStats.completedAt),
        ),
      )
      .orderBy(desc(userStats.completedAt))
      .all();

    // In-progress game (most recent incomplete)
    const inProgress = await db
      .select({
        puzzleId: userStats.puzzleId,
        timeSeconds: userStats.timeSeconds,
        startedAt: userStats.startedAt,
        difficultyLabel: puzzles.difficultyLabel,
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
      .all();

    const validCompleted = completed.filter(
      (g): g is CompletedGame =>
        g.timeSeconds != null && g.completedAt != null,
    );

    const totalCompleted = validCompleted.length;
    const totalTime = validCompleted.reduce((s, g) => s + g.timeSeconds, 0);
    const averageTime = totalCompleted > 0 ? Math.round(totalTime / totalCompleted) : 0;
    const bestTime = totalCompleted > 0 ? Math.min(...validCompleted.map((g) => g.timeSeconds)) : 0;

    // Best times per difficulty
    const bestTimes: Record<string, number> = {};
    for (const g of validCompleted) {
      if (!bestTimes[g.difficultyLabel] || g.timeSeconds < bestTimes[g.difficultyLabel]) {
        bestTimes[g.difficultyLabel] = g.timeSeconds;
      }
    }

    // Distribution by difficulty
    const difficultyDistribution: Record<string, number> = {};
    for (const g of validCompleted) {
      difficultyDistribution[g.difficultyLabel] =
        (difficultyDistribution[g.difficultyLabel] || 0) + 1;
    }

    const recentGames = validCompleted.slice(0, 30);

    const currentInProgress: InProgressGame | null =
      inProgress.length > 0 ? inProgress[0] : null;

    const stats: StatsData = {
      totalCompleted,
      averageTime,
      bestTime,
      recentGames,
      bestTimes,
      difficultyDistribution,
      currentInProgress,
    };

    return { stats, signedIn: true };
  } catch {
    return { stats: null, signedIn: false };
  }
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  try {
    return await serverLoader();
  } catch {
    // Offline — fall back to anonymous view with localStorage stats
    return { stats: null, signedIn: false };
  }
}
clientLoader.hydrate = true as const;

// ── SVG Charts ──

const TimeTrendChart = memo(function TimeTrendChart({ games }: { games: CompletedGame[] }) {
  if (games.length < 2) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Complete at least 2 puzzles to see your time trend.
      </p>
    );
  }

  // Reverse so oldest is first (left to right)
  const data = [...games].reverse();
  const times = data.map((g) => g.timeSeconds);
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  const timeRange = maxTime - minTime || 1;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 600;
  const chartHeight = 200;
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const points = data.map((_, i) => {
    const x = padding.left + (i / (data.length - 1)) * innerW;
    const y =
      padding.top + (1 - (times[i] - minTime) / timeRange) * innerH;
    return `${x},${y}`;
  });

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = minTime + (timeRange * i) / 4;
    const y = padding.top + (1 - i / 4) * innerH;
    return { label: formatTime(Math.round(val)), y };
  });

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full h-auto"
      role="img"
      aria-label="Time trend chart showing completion times for recent puzzles"
    >
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <line
          key={tick.label}
          x1={padding.left}
          y1={tick.y}
          x2={chartWidth - padding.right}
          y2={tick.y}
          stroke="currentColor"
          strokeOpacity={0.1}
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((tick) => (
        <text
          key={tick.label + "-label"}
          x={padding.left - 8}
          y={tick.y + 4}
          textAnchor="end"
          fontSize={11}
          fill="currentColor"
          fillOpacity={0.5}
        >
          {tick.label}
        </text>
      ))}

      {/* X-axis label */}
      <text
        x={chartWidth / 2}
        y={chartHeight - 5}
        textAnchor="middle"
        fontSize={11}
        fill="currentColor"
        fillOpacity={0.5}
      >
        Puzzle #
      </text>

      {/* Data line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points */}
      {data.map((_, i) => {
        const [x, y] = points[i].split(",").map(Number);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill="var(--color-primary)"
          />
        );
      })}
    </svg>
  );
});

const DifficultyChart = memo(function DifficultyChart({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  const entries = DIFFICULTY_ORDER.filter((d) => distribution[d])
    .map((d) => ({ label: d, count: distribution[d] }));

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No completed puzzles yet.
      </p>
    );
  }

  const maxCount = Math.max(...entries.map((e) => e.count));
  const barHeight = 32;
  const gap = 8;
  const labelWidth = 70;
  const countWidth = 40;
  const chartWidth = 400;
  const svgHeight = entries.length * (barHeight + gap) - gap + 10;
  const barMaxWidth = chartWidth - labelWidth - countWidth - 20;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${svgHeight}`}
      className="w-full h-auto"
      role="img"
      aria-label="Bar chart showing puzzles completed per difficulty level"
    >
      {entries.map((entry, i) => {
        const y = i * (barHeight + gap);
        const barW = (entry.count / maxCount) * barMaxWidth;
        const color = DIFFICULTY_COLORS[entry.label] || "var(--color-primary)";

        return (
          <g key={entry.label}>
            <text
              x={labelWidth - 8}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              fontSize={12}
              fill="currentColor"
              fillOpacity={0.7}
            >
              {entry.label}
            </text>
            <rect
              x={labelWidth}
              y={y + 4}
              width={barW}
              height={barHeight - 8}
              rx={4}
              fill={color}
              fillOpacity={0.8}
            />
            <text
              x={labelWidth + barW + 8}
              y={y + barHeight / 2 + 4}
              fontSize={12}
              fill="currentColor"
              fillOpacity={0.6}
            >
              {entry.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
});

// ── Local Stats (anonymous) ──

interface LocalStats {
  totalCompleted: number;
  bestTime: number | null;
}

function useLocalStats(): LocalStats {
  const [stats, setStats] = useState<LocalStats>({
    totalCompleted: 0,
    bestTime: null,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("super_sudoku_game_history");
      if (raw) {
        const history = JSON.parse(raw) as Array<{
          completed?: boolean;
          timeSeconds?: number;
        }>;
        const completed = history.filter((g) => g.completed);
        const times = completed
          .map((g) => g.timeSeconds)
          .filter((t): t is number => t != null);
        setStats({
          totalCompleted: completed.length,
          bestTime: times.length > 0 ? Math.min(...times) : null,
        });
      }
    } catch {
      // No local stats
    }
  }, []);

  return stats;
}

// ── Component ──

export default function StatsPage({ loaderData }: Route.ComponentProps) {
  const { stats, signedIn } = loaderData;
  const { user } = useOutletContext<{
    user: { id: string; name: string | null } | null;
  }>();

  // Anonymous / not signed in view
  if (!signedIn || !stats) {
    return <AnonymousStatsView />;
  }

  return (
    <div className="w-full max-w-xl mx-auto px-5 py-8 pb-20 sm:pb-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif">Your Stats</h1>
          <p className="text-muted-foreground mt-1">
            Track your puzzle-solving progress.
          </p>
        </div>

        {/* A. Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-serif">
                Puzzles Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalCompleted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-serif">
                Average Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {stats.totalCompleted > 0 ? formatTime(stats.averageTime) : "--"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-serif">
                Best Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {stats.totalCompleted > 0 ? formatTime(stats.bestTime) : "--"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* E. In-Progress */}
        {stats.currentInProgress ? (
          <Card className="border-amber-300 dark:border-amber-700">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Puzzle in progress</p>
                <p className="text-xs text-muted-foreground">
                  {stats.currentInProgress.difficultyLabel}
                  {stats.currentInProgress.timeSeconds != null
                    ? ` — ${formatTime(stats.currentInProgress.timeSeconds)} elapsed`
                    : ""}
                </p>
              </div>
              <Button asChild size="sm">
                <Link to={`/play/${stats.currentInProgress.puzzleId}`}>
                  Resume
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* B. Time Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Time Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeTrendChart games={stats.recentGames} />
          </CardContent>
        </Card>

        {/* C. Difficulty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyChart distribution={stats.difficultyDistribution} />
          </CardContent>
        </Card>

        {/* D. Best Times Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Best Times by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.bestTimes).length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">
                      Difficulty
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      Best Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DIFFICULTY_ORDER.filter((d) => stats.bestTimes[d] != null).map(
                    (d) => (
                      <tr key={d} className="border-b last:border-0">
                        <td className="py-2 flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: DIFFICULTY_COLORS[d] }}
                          />
                          {d}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {formatTime(stats.bestTimes[d])}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No completed puzzles yet.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="pb-4">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
    </div>
  );
}

function AnonymousStatsView() {
  const localStats = useLocalStats();

  return (
    <div className="w-full max-w-xl mx-auto px-5 py-8 pb-20 sm:pb-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif">Your Stats</h1>
          <p className="text-muted-foreground mt-1">
            Track your puzzle-solving progress.
          </p>
        </div>

        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">
              Sign in to track your stats across devices and see detailed
              analytics of your puzzle-solving progress.
            </p>

            {localStats.totalCompleted > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  From this device:
                </p>
                <div className="flex justify-center gap-8">
                  <div>
                    <p className="text-2xl font-bold">
                      {localStats.totalCompleted}
                    </p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  {localStats.bestTime != null ? (
                    <div>
                      <p className="text-2xl font-bold">
                        {formatTime(localStats.bestTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">Best Time</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <Button asChild>
              <Link to="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="pb-4">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
    </div>
  );
}
