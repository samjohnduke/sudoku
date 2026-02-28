# Paper & Ink Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform SUPERSudoku from a default-shadcn developer prototype into a refined, minimal "Paper & Ink" aesthetic that feels like a premium native app on mobile.

**Architecture:** Pure visual redesign — no changes to game logic, API routes, or data layer. We modify CSS theme tokens, fonts, and component markup/styles. The play screen becomes fully immersive (no header/nav). Home screen switches from slider to difficulty chips. Bottom nav gets icons and hides during gameplay.

**Tech Stack:** Tailwind CSS 4, Google Fonts (DM Serif Display, DM Sans, JetBrains Mono), Lucide React icons, CSS animations (no new deps).

---

### Task 1: Fonts and Theme Tokens

**Files:**
- Modify: `app/app.css` (entire file)
- Modify: `app/root.tsx:34-41` (links function for font preconnect)

**Step 1: Update the Google Fonts import and font-family theme**

In `app/app.css`, replace the existing Google Fonts import (line 1) with:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

Replace the `@theme` font block (lines 8-11) with:

```css
@theme {
  --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-serif: "DM Serif Display", ui-serif, Georgia, "Times New Roman", serif;
  --font-mono: "JetBrains Mono", ui-monospace, "Cascadia Code", "Fira Code", monospace;
}
```

**Step 2: Replace the light mode color tokens**

Replace the `:root` block (lines 63-97) with:

```css
:root {
  --radius: 0.625rem;
  --background: hsl(40 30% 97%);
  --foreground: hsl(30 10% 12%);
  --card: hsl(40 25% 95%);
  --card-foreground: hsl(30 10% 12%);
  --popover: hsl(40 25% 95%);
  --popover-foreground: hsl(30 10% 12%);
  --primary: hsl(220 25% 50%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(40 15% 93%);
  --secondary-foreground: hsl(30 10% 20%);
  --muted: hsl(40 15% 93%);
  --muted-foreground: hsl(30 10% 55%);
  --accent: hsl(220 20% 94%);
  --accent-foreground: hsl(220 25% 40%);
  --destructive: hsl(0 55% 55%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(30 12% 88%);
  --input: hsl(30 12% 88%);
  --ring: hsl(220 25% 50%);
  --chart-1: hsl(220 25% 50%);
  --chart-2: hsl(220 20% 65%);
  --chart-3: hsl(220 30% 40%);
  --chart-4: hsl(150 30% 45%);
  --chart-5: hsl(30 10% 55%);
  --sidebar: hsl(40 25% 95%);
  --sidebar-foreground: hsl(30 10% 12%);
  --sidebar-primary: hsl(220 25% 50%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(220 20% 94%);
  --sidebar-accent-foreground: hsl(220 25% 40%);
  --sidebar-border: hsl(30 12% 88%);
  --sidebar-ring: hsl(220 25% 50%);
}
```

**Step 3: Replace the dark mode color tokens**

Replace the `.dark` block (lines 99-132) with:

```css
.dark {
  --background: hsl(30 8% 10%);
  --foreground: hsl(40 15% 88%);
  --card: hsl(30 8% 13%);
  --card-foreground: hsl(40 15% 88%);
  --popover: hsl(30 8% 13%);
  --popover-foreground: hsl(40 15% 88%);
  --primary: hsl(220 35% 62%);
  --primary-foreground: hsl(30 8% 10%);
  --secondary: hsl(30 6% 18%);
  --secondary-foreground: hsl(40 12% 82%);
  --muted: hsl(30 6% 18%);
  --muted-foreground: hsl(30 8% 50%);
  --accent: hsl(220 15% 22%);
  --accent-foreground: hsl(220 35% 75%);
  --destructive: hsl(0 50% 48%);
  --destructive-foreground: hsl(0 0% 98%);
  --border: hsl(30 6% 20%);
  --input: hsl(30 6% 20%);
  --ring: hsl(220 35% 62%);
  --chart-1: hsl(220 35% 62%);
  --chart-2: hsl(220 25% 55%);
  --chart-3: hsl(220 40% 50%);
  --chart-4: hsl(150 25% 50%);
  --chart-5: hsl(30 8% 50%);
  --sidebar: hsl(30 8% 13%);
  --sidebar-foreground: hsl(40 15% 88%);
  --sidebar-primary: hsl(220 35% 62%);
  --sidebar-primary-foreground: hsl(40 15% 88%);
  --sidebar-accent: hsl(220 15% 22%);
  --sidebar-accent-foreground: hsl(220 35% 75%);
  --sidebar-border: hsl(30 6% 20%);
  --sidebar-ring: hsl(220 35% 62%);
}
```

**Step 4: Add animation keyframes at the end of app.css**

Append after the `@layer base` block:

```css
@keyframes cell-pop {
  0% { transform: scale(0.85); opacity: 0; }
  60% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes cell-tap {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

@keyframes cell-ripple {
  0% { background-color: var(--primary); opacity: 0.15; }
  100% { background-color: transparent; opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-cell-pop {
  animation: cell-pop 150ms ease-out forwards;
}

.animate-cell-tap {
  animation: cell-tap 100ms ease-out;
}

.animate-fade-in {
  animation: fade-in 200ms ease-out forwards;
}

.animate-slide-up {
  animation: slide-up 300ms ease-out forwards;
}
```

**Step 5: Run the dev server to verify fonts load and colors look correct**

Run: `cd /Users/samduke/Development/personal/supersudoku && npm run dev`
Expected: App loads with new cream/linen background, slate-blue accent, DM Sans body text.

**Step 6: Commit**

```bash
git add app/app.css app/root.tsx
git commit -m "feat: new Paper & Ink theme tokens, fonts, and animation keyframes"
```

---

### Task 2: Header and Bottom Navigation

**Files:**
- Modify: `app/components/layout/header.tsx` (entire file)
- Modify: `app/root.tsx:61-69` (App component)

**Step 1: Rewrite the Header component with icons and immersive play support**

Replace the entire `app/components/layout/header.tsx` with:

```tsx
import { Link, useLocation } from "react-router";
import { cn } from "~/lib/utils";
import { Grid3X3, BookOpen, BarChart2, Settings } from "lucide-react";

interface HeaderProps {
  user: { id: string; name: string | null } | null;
}

const NAV_ITEMS = [
  { to: "/", label: "Play", icon: Grid3X3 },
  { to: "/bible", label: "Learn", icon: BookOpen },
  { to: "/stats", label: "Stats", icon: BarChart2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Header({ user }: HeaderProps) {
  const location = useLocation();

  // Hide header entirely on play pages
  const isPlayPage = location.pathname.startsWith("/play/");
  if (isPlayPage) return null;

  return (
    <>
      {/* Desktop header */}
      <header className="hidden sm:block border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl text-foreground tracking-wide">
            SUPERSudoku
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  location.pathname === item.to ||
                    (item.to === "/bible" && location.pathname.startsWith("/bible"))
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <span className="text-sm text-muted-foreground">
                {user.name || "Player"}
              </span>
            ) : (
              <Link
                to="/auth/signin"
                className="text-sm text-primary hover:underline"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/95 backdrop-blur-md z-50">
        <div className="flex justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to === "/bible" && location.pathname.startsWith("/bible"));

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 min-w-[64px] transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
```

**Step 2: Update root.tsx App component to not add bottom padding on play pages**

In `app/root.tsx`, update the App component (line 65):

Replace:
```tsx
<div className="min-h-screen pb-16 sm:pb-0">
```
With:
```tsx
<div className="min-h-screen">
```

The bottom padding is only needed on non-play pages. We'll handle that per-route.

**Step 3: Verify the header/nav changes**

Run: `npm run dev`
Expected: Desktop shows serif logo + text nav. Mobile shows icon + label bottom nav. Navigating to a /play/ URL hides both.

**Step 4: Commit**

```bash
git add app/components/layout/header.tsx app/root.tsx
git commit -m "feat: redesign header with serif logo, icon bottom nav, immersive play mode"
```

---

### Task 3: Home Screen Redesign

**Files:**
- Modify: `app/routes/home.tsx` (entire component rewrite)

**Step 1: Rewrite the home screen with difficulty chips and resume card**

Replace the entire `app/routes/home.tsx` with:

```tsx
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
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
        <div className="flex flex-col items-center gap-1 animate-fade-in">
          <h1 className="font-serif text-5xl sm:text-6xl tracking-wide text-foreground leading-none">
            SUPER
          </h1>
          <h1 className="font-serif text-5xl sm:text-6xl tracking-[0.2em] text-foreground leading-none">
            SUDOKU
          </h1>
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
```

**Step 2: Verify home screen**

Run: `npm run dev`, navigate to `/`
Expected: Two-line serif logo, difficulty chips, wide "New Puzzle" button. Resume card shows if user has in-progress game.

**Step 3: Commit**

```bash
git add app/routes/home.tsx
git commit -m "feat: redesign home screen with difficulty chips and resume card"
```

---

### Task 4: Board Component Redesign

**Files:**
- Modify: `app/components/sudoku/board.tsx` (entire file)

**Step 1: Rewrite the Board component with refined grid styling**

Replace entire `app/components/sudoku/board.tsx`:

```tsx
import { cn } from "~/lib/utils";
import { Cell } from "./cell";
import type { GameState, GameSettings } from "./types";

interface BoardProps {
  game: GameState;
  settings: GameSettings;
  onSelectCell: (index: number) => void;
  hintCells?: number[];
}

const EMPTY_SET = new Set<number>();

function getRow(index: number) {
  return Math.floor(index / 9);
}

function getCol(index: number) {
  return index % 9;
}

function getBox(index: number) {
  return Math.floor(getRow(index) / 3) * 3 + Math.floor(getCol(index) / 3);
}

export function Board({ game, settings, onSelectCell, hintCells }: BoardProps) {
  const hintCellSet = hintCells ? new Set(hintCells) : null;
  const selectedRow =
    game.selectedCell !== null ? getRow(game.selectedCell) : -1;
  const selectedCol =
    game.selectedCell !== null ? getCol(game.selectedCell) : -1;
  const selectedBox =
    game.selectedCell !== null ? getBox(game.selectedCell) : -1;
  const selectedValue =
    game.selectedCell !== null ? game.current[game.selectedCell] : 0;

  return (
    <div
      role="grid"
      aria-label="Sudoku board"
      className={cn(
        "grid grid-cols-9",
        "border-[2.5px] border-foreground/50 rounded-lg overflow-hidden",
        "w-full max-w-md mx-auto aspect-square",
        "shadow-sm",
      )}
      style={{ containerType: "inline-size" }}
    >
      {game.current.map((value, index) => {
        const row = getRow(index);
        const col = getCol(index);
        const box = getBox(index);
        const isInitial = game.initial[index] !== 0;
        const isSelected = game.selectedCell === index;
        const isHighlighted =
          settings.highlightMatching &&
          selectedValue > 0 &&
          value === selectedValue &&
          !isSelected;
        const isError =
          settings.showErrors &&
          value > 0 &&
          value !== game.solution[index];
        const isSameRow = !isSelected && row === selectedRow;
        const isSameCol = !isSelected && col === selectedCol;
        const isSameBox = !isSelected && box === selectedBox;

        return (
          <Cell
            key={index}
            index={index}
            value={value}
            isInitial={isInitial}
            isSelected={isSelected}
            isHighlighted={isHighlighted}
            isError={isError}
            isHint={hintCellSet !== null && hintCellSet.has(index)}
            isSameRow={isSameRow}
            isSameCol={isSameCol}
            isSameBox={isSameBox}
            isComplete={game.isComplete}
            notes={game.notes.get(index) ?? EMPTY_SET}
            centerNotes={game.centerNotes.get(index) ?? EMPTY_SET}
            onSelect={onSelectCell}
          />
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/sudoku/board.tsx
git commit -m "feat: refined board with stronger box borders and shadow"
```

---

### Task 5: Cell Component Redesign

**Files:**
- Modify: `app/components/sudoku/cell.tsx` (entire file)

**Step 1: Rewrite Cell with new color states, mono numbers, and animations**

Replace entire `app/components/sudoku/cell.tsx`:

```tsx
import { cn } from "~/lib/utils";

interface CellProps {
  index: number;
  value: number;
  isInitial: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isError: boolean;
  isHint: boolean;
  isSameRow: boolean;
  isSameCol: boolean;
  isSameBox: boolean;
  isComplete: boolean;
  notes: Set<number>;
  centerNotes: Set<number>;
  onSelect: (index: number) => void;
}

const NOTE_POSITIONS = [
  "col-start-1 row-start-1", // 1
  "col-start-2 row-start-1", // 2
  "col-start-3 row-start-1", // 3
  "col-start-1 row-start-2", // 4
  "col-start-2 row-start-2", // 5
  "col-start-3 row-start-2", // 6
  "col-start-1 row-start-3", // 7
  "col-start-2 row-start-3", // 8
  "col-start-3 row-start-3", // 9
];

export function Cell({
  index,
  value,
  isInitial,
  isSelected,
  isHighlighted,
  isError,
  isHint,
  isSameRow,
  isSameCol,
  isSameBox,
  isComplete,
  notes,
  centerNotes,
  onSelect,
}: CellProps) {
  const row = Math.floor(index / 9);
  const col = index % 9;

  const hasCornerNotes = notes.size > 0;
  const hasCenterNotes = centerNotes.size > 0;

  return (
    <button
      type="button"
      role="gridcell"
      aria-label={`Row ${row + 1}, Column ${col + 1}${value > 0 ? `, value ${value}` : ", empty"}`}
      aria-selected={isSelected}
      className={cn(
        "aspect-square flex items-center justify-center relative",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset",
        // Thin inner borders
        "border-r border-b border-foreground/[0.12]",
        // Thick 3x3 box borders
        col % 3 === 0 && col > 0 && "border-l-[2px] border-l-foreground/50",
        row % 3 === 0 && row > 0 && "border-t-[2px] border-t-foreground/50",
        // Background states (priority order)
        isSelected
          ? "bg-primary/12"
          : isHint
            ? "bg-amber-200/40 dark:bg-amber-500/20"
            : isHighlighted
              ? "bg-primary/8"
              : (isSameRow || isSameCol || isSameBox)
                ? "bg-foreground/[0.03]"
                : "bg-background",
        // Completion ripple
        isComplete && "animate-cell-ripple",
        // Tap interaction
        !isComplete && "active:animate-cell-tap",
      )}
      style={isComplete ? { animationDelay: `${(row * 9 + col) * 12}ms` } : undefined}
      onClick={() => onSelect(index)}
    >
      {value > 0 ? (
        <span
          className={cn(
            "font-mono text-[clamp(0.9rem,3.8cqi,1.75rem)] leading-none",
            // Text color
            isError && "text-destructive",
            !isError && isInitial && "font-semibold text-foreground",
            !isError && !isInitial && "text-primary font-medium",
            // Entry animation for non-initial values
            !isInitial && "animate-cell-pop",
          )}
        >
          {value}
        </span>
      ) : hasCornerNotes ? (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[1px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span
              key={n}
              className={cn(
                NOTE_POSITIONS[n - 1],
                "flex items-center justify-center font-mono text-[clamp(0.35rem,1.4cqi,0.6rem)] leading-none text-muted-foreground",
              )}
            >
              {notes.has(n) ? n : ""}
            </span>
          ))}
        </div>
      ) : hasCenterNotes ? (
        <span className="font-mono text-[clamp(0.45rem,1.7cqi,0.65rem)] leading-none text-muted-foreground tracking-wider">
          {Array.from(centerNotes).sort().join("")}
        </span>
      ) : null}
    </button>
  );
}
```

**Step 2: Verify board rendering**

Run: `npm run dev`, start a puzzle
Expected: Board has JetBrains Mono numbers, stronger box borders, selected cell has blue tint, user-entered numbers are blue, given numbers are ink-black bold.

**Step 3: Commit**

```bash
git add app/components/sudoku/cell.tsx
git commit -m "feat: redesign cell with mono font, refined colors, and animations"
```

---

### Task 6: Number Pad Redesign

**Files:**
- Modify: `app/components/sudoku/number-pad.tsx` (entire file)

**Step 1: Rewrite NumberPad with 4-column layout, pill segmented control, and icons**

Replace entire `app/components/sudoku/number-pad.tsx`:

```tsx
import { cn } from "~/lib/utils";
import { Delete, Undo2, Redo2 } from "lucide-react";

export type InputMode = "value" | "corner" | "center";

interface NumberPadProps {
  onNumber: (n: number) => void;
  onDelete: () => void;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const modes: { value: InputMode; label: string }[] = [
  { value: "value", label: "Value" },
  { value: "corner", label: "Corner" },
  { value: "center", label: "Center" },
];

export function NumberPad({
  onNumber,
  onDelete,
  mode,
  onModeChange,
  onUndo,
  onRedo,
}: NumberPadProps) {
  return (
    <div className="flex flex-col gap-3 max-w-md mx-auto w-full px-1">
      {/* Segmented mode toggle */}
      <div className="flex bg-secondary rounded-xl p-1 gap-0.5">
        {modes.map((m) => (
          <button
            key={m.value}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              mode === m.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onModeChange(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Number grid: 4 columns */}
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            className={cn(
              "font-mono text-lg font-medium",
              "h-12 rounded-xl",
              "bg-secondary/60 hover:bg-secondary active:bg-secondary/80",
              "transition-colors duration-100",
              "flex items-center justify-center",
            )}
            onClick={() => onNumber(n)}
          >
            {n}
          </button>
        ))}
        <button
          className={cn(
            "h-12 rounded-xl",
            "bg-secondary/60 hover:bg-secondary active:bg-secondary/80",
            "transition-colors duration-100",
            "flex items-center justify-center text-muted-foreground",
          )}
          onClick={onDelete}
          aria-label="Delete"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          className={cn(
            "h-12 rounded-xl",
            "bg-secondary/60 hover:bg-secondary active:bg-secondary/80",
            "transition-colors duration-100",
            "flex items-center justify-center text-muted-foreground",
          )}
          onClick={onUndo}
          aria-label="Undo"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          className={cn(
            "h-12 rounded-xl",
            "bg-secondary/60 hover:bg-secondary active:bg-secondary/80",
            "transition-colors duration-100",
            "flex items-center justify-center text-muted-foreground",
          )}
          onClick={onRedo}
          aria-label="Redo"
        >
          <Redo2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verify number pad**

Run: `npm run dev`, start a puzzle
Expected: Pill-shaped mode toggle, 4-column number grid with rounded buttons, icons for delete/undo/redo.

**Step 3: Commit**

```bash
git add app/components/sudoku/number-pad.tsx
git commit -m "feat: redesign number pad with segmented toggle, 4-col layout, icons"
```

---

### Task 7: Play Screen Redesign

**Files:**
- Modify: `app/routes/play.$puzzleId.tsx` (component portion, lines 158-346)

**Step 1: Rewrite the PlayRoute component JSX for immersive layout**

Replace the return statement of `PlayRoute` (from line 247 `return (` to line 345 `);`) with:

```tsx
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
          </div>
        ) : null}
      </main>
    </div>
  );
```

**Step 2: Verify play screen**

Run: `npm run dev`, navigate to a puzzle
Expected: Immersive layout, no header/nav visible. Floating back/difficulty/timer. Board is hero. Number pad at bottom with new design.

**Step 3: Commit**

```bash
git add app/routes/play.\$puzzleId.tsx
git commit -m "feat: immersive play screen with floating info bar"
```

---

### Task 8: Settings Page Restyle

**Files:**
- Modify: `app/routes/settings.tsx` (component JSX only)

**Step 1: Update typography and card styling in settings**

In the `SettingsPage` component return statement, make these changes:

1. Replace the h1 (line 183):
```tsx
<h1 className="font-serif text-3xl tracking-tight">Settings</h1>
```

2. Replace both CardTitle elements for "Assists" and "Appearance" sections to use `font-serif`:
```tsx
<CardTitle className="font-serif">Assists</CardTitle>
```
```tsx
<CardTitle className="font-serif">Appearance</CardTitle>
```
```tsx
<CardTitle className="font-serif">Account</CardTitle>
```

3. Update theme button labels from "Warm Light" / "Warm Dark" to "Light" / "Dark".

4. Add `pb-20 sm:pb-0` to the outer div className for mobile nav spacing:
```tsx
<div className="flex min-h-screen justify-center pb-20 sm:pb-0">
```

**Step 2: Commit**

```bash
git add app/routes/settings.tsx
git commit -m "feat: restyle settings with serif headings"
```

---

### Task 9: Stats Page Restyle

**Files:**
- Modify: `app/routes/stats.tsx` (typography and chart colors)

**Step 1: Update typography**

1. Both h1 tags (lines 407, 559): add `font-serif` class
2. All `CardTitle` components: add `font-serif` class
3. Update `DIFFICULTY_COLORS` (lines 52-58) to use the new palette:
```tsx
const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "#6b9080",
  Easy: "#5b7fa5",
  Medium: "#8a7a5e",
  Hard: "#b07050",
  Expert: "#c25555",
};
```

4. Replace hard-coded `#d97706` in `TimeTrendChart` (lines 253, 264) with `var(--color-primary)`:
```tsx
stroke="var(--color-primary)"
```
```tsx
fill="var(--color-primary)"
```

5. Add `pb-20 sm:pb-0` to both outer divs for mobile nav spacing.

**Step 2: Commit**

```bash
git add app/routes/stats.tsx
git commit -m "feat: restyle stats with serif headings and new chart colors"
```

---

### Task 10: Bible/Learn Pages Restyle and Rename

**Files:**
- Modify: `app/routes/bible.tsx`
- Modify: `app/routes/bible.$technique.tsx`
- Modify: `app/routes.ts` (route labels remain the same — paths stay `/bible`)

**Step 1: Update bible index page**

In `app/routes/bible.tsx`:

1. Update meta title (line 8): `"Solving Techniques — SUPERSudoku"`
2. Update h1 (line 15): add `font-serif` class, change text to `"Solving Techniques"`
3. Update description (line 16): `"Master every technique from naked singles to unique rectangles."`
4. Add `pb-20 sm:pb-0` to the outer div className.
5. Replace `Badge variant="outline"` with `Badge variant="secondary"` for categories.

**Step 2: Update bible technique page**

In `app/routes/bible.$technique.tsx`:

1. Update meta title (line 13): Change `"Bible"` to `"Learn"`
2. Update breadcrumb (line 37): Change link text from `"Bible"` to `"Techniques"`
3. Add `font-serif` to h1 (line 43)
4. Add `font-serif` to "Interactive Demo" h2 (line 64)
5. Section headings (h2 tags lines 49, 53, 57): add `font-serif`
6. Add `pb-20 sm:pb-0` to outer div.

**Step 3: Commit**

```bash
git add app/routes/bible.tsx app/routes/bible.\$technique.tsx
git commit -m "feat: restyle learn pages with serif headings"
```

---

### Task 11: Auth Sign-in Page Restyle

**Files:**
- Modify: `app/routes/auth.signin.tsx`

**Step 1: Update sign-in page styling**

1. Update CardTitle (line 62): add `font-serif`, change text to `"Sign in"`
2. Add `pb-20 sm:pb-0` class to outer div.
3. Add `rounded-xl` to both buttons.

**Step 2: Commit**

```bash
git add app/routes/auth.signin.tsx
git commit -m "feat: restyle sign-in page"
```

---

### Task 12: Tutorial Board Restyle

**Files:**
- Modify: `app/components/bible/tutorial-board.tsx`

**Step 1: Update tutorial board to match new board styling**

1. Update outer border (line 134): `"border-[2.5px] border-foreground/50 rounded-lg overflow-hidden"`
2. Update cell borders to match new opacity values:
   - Thin borders: `border-foreground/[0.12]`
   - Thick box borders: `border-l-foreground/50`, `border-t-foreground/50`
3. Add `font-mono` class to all number display spans.

**Step 2: Commit**

```bash
git add app/components/bible/tutorial-board.tsx
git commit -m "feat: restyle tutorial board to match new game board"
```

---

### Task 13: Final Verification and Typecheck

**Step 1: Run typecheck**

Run: `cd /Users/samduke/Development/personal/supersudoku && npm run typecheck`
Expected: No type errors.

**Step 2: Run dev server and visually verify all pages**

Run: `npm run dev`
Check each route:
- `/` — Home: serif logo, chips, resume card (if applicable)
- `/play/:id` — Play: immersive, no nav, refined board, new number pad
- `/bible` — Learn index: serif headings, refined cards
- `/bible/:technique` — Technique detail: serif headings, matching board style
- `/stats` — Stats: serif headings, new chart colors
- `/settings` — Settings: serif headings, toggle styling
- `/auth/signin` — Sign in: serif heading

Verify dark mode works on all pages.

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final visual adjustments after full verification"
```
