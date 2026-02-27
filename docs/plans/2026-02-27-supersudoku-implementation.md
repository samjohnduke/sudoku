# SUPERSudoku Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a pure, warm sudoku app with technique-based difficulty grading, interactive solving tutorials, and optional passkey auth for cross-device sync.

**Architecture:** Monolith Cloudflare Worker serving React Router v7 in framework mode (SSR). D1 for all persistence. Local CLI tool for puzzle generation + difficulty grading. Better Auth with passkeys for optional accounts.

**Tech Stack:** React Router v7, Cloudflare Workers + D1, shadcn/ui (Tailwind v4), Better Auth + passkeys, Drizzle ORM, TypeScript, Vitest

---

## Phase 1: Project Scaffolding

### Task 1: Scaffold React Router v7 + Cloudflare Workers

**Files:**
- Create: `supersudoku/` project root (already exists with docs/)

**Step 1: Create the project**

```bash
cd /Users/samduke/Development/personal/supersudoku
npx create-react-router@latest . --template remix-run/react-router-templates/cloudflare
```

If it complains about existing files, scaffold in a temp dir and copy over. The template gives us:
- `vite.config.ts` with `cloudflare()` + `reactRouter()` + `tailwindcss()`
- `workers/app.ts` entry point
- `react-router.config.ts` with `ssr: true` and `v8_viteEnvironmentApi: true`
- `wrangler.jsonc` base config
- `app/` directory with routes

**Step 2: Verify dev server starts**

```bash
npm install
npm run dev
```

Expected: Dev server starts, shows React Router welcome page at localhost.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: scaffold React Router v7 + Cloudflare Workers"
```

---

### Task 2: Set up shadcn/ui

**Files:**
- Modify: `app/app.css`
- Create: `components.json`
- Create: `app/lib/utils.ts`

**Step 1: Initialize shadcn**

```bash
npx shadcn@latest init
```

Select: New York style, Slate base color, CSS variables: yes.

**Step 2: Add initial components**

```bash
npx shadcn@latest add button card slider dialog tabs toggle-group tooltip scroll-area separator badge
```

**Step 3: Verify components render**

Edit `app/routes/home.tsx` to import and render a Button. Confirm it renders with warm styling in the browser.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add shadcn/ui with initial components"
```

---

### Task 3: Set up D1 database + Drizzle ORM

**Files:**
- Modify: `wrangler.jsonc`
- Create: `app/db/schema.ts`
- Create: `app/db/index.ts`
- Create: `migrations/0001_initial.sql`

**Step 1: Create D1 database**

```bash
npx wrangler d1 create supersudoku-db
```

Copy the `database_id` from output.

**Step 2: Add D1 binding to wrangler.jsonc**

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "supersudoku-db",
      "database_id": "<paste-id-here>"
    }
  ]
}
```

**Step 3: Generate types**

```bash
npx wrangler types
```

This creates/updates `worker-configuration.d.ts` with the `Env` interface containing `DB: D1Database`.

**Step 4: Install Drizzle**

```bash
npm install drizzle-orm
npm install -D drizzle-kit
```

**Step 5: Create schema**

```typescript
// app/db/schema.ts
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const puzzles = sqliteTable("puzzles", {
  id: text("id").primaryKey(),
  puzzle: text("puzzle").notNull(),        // 81-char string, dots for blanks
  solution: text("solution").notNull(),     // 81-char string
  difficultyScore: real("difficulty_score").notNull(),
  difficultyLabel: text("difficulty_label").notNull(),
  techniquesRequired: text("techniques_required").notNull(), // JSON array
  clueCount: integer("clue_count").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userStats = sqliteTable("user_stats", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id"),            // anonymous tracking (optional)
  userId: text("user_id"),                  // FK to better-auth user table
  puzzleId: text("puzzle_id").notNull().references(() => puzzles.id),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  timeSeconds: integer("time_seconds"),
  assistsUsed: text("assists_used"),        // JSON
  notesSnapshot: text("notes_snapshot"),    // JSON for resume
  boardState: text("board_state"),          // 81-char current state
});

export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  settings: text("settings").notNull(),     // JSON
});
```

**Step 6: Create Drizzle config**

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./app/db/schema.ts",
  dialect: "sqlite",
});
```

**Step 7: Create DB helper**

```typescript
// app/db/index.ts
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof getDb>;
```

**Step 8: Generate and apply migration**

```bash
npx drizzle-kit generate
npx wrangler d1 migrations apply supersudoku-db --local
```

**Step 9: Commit**

```bash
git add -A && git commit -m "feat: set up D1 database with Drizzle schema"
```

---

### Task 4: Set up Better Auth with passkeys

**Files:**
- Create: `app/lib/auth/auth.server.ts`
- Create: `app/lib/auth/auth-client.ts`
- Create: `app/routes/api.auth.$.ts`
- Modify: `app/routes.ts`
- Create: `.dev.vars`

**Step 1: Install Better Auth**

```bash
npm install better-auth @better-auth/passkey
```

**Step 2: Create `.dev.vars`**

```
BETTER_AUTH_SECRET=dev-secret-change-in-production-xxxxxxxxxxxxxxx
BETTER_AUTH_URL=http://localhost:5173
```

Add `.dev.vars` to `.gitignore`.

**Step 3: Create server auth config**

```typescript
// app/lib/auth/auth.server.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { drizzle } from "drizzle-orm/d1";

export function createAuth(db: D1Database, env: { BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }) {
  const database = drizzle(db);

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(database, { provider: "sqlite" }),
    plugins: [
      passkey({
        rpID: new URL(env.BETTER_AUTH_URL).hostname,
        rpName: "SUPERSudoku",
        origin: env.BETTER_AUTH_URL,
      }),
    ],
    trustedOrigins: [env.BETTER_AUTH_URL],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    advanced: {
      defaultCookieAttributes: {
        secure: true,
        httpOnly: true,
        sameSite: "lax",
      },
    },
  });
}
```

**Step 4: Create client auth**

```typescript
// app/lib/auth/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  plugins: [passkeyClient()],
});
```

**Step 5: Create auth API route**

```typescript
// app/routes/api.auth.$.ts
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { createAuth } from "~/lib/auth/auth.server";

function getAuth(context: LoaderFunctionArgs["context"]) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  return createAuth(cloudflare.env.DB, {
    BETTER_AUTH_SECRET: cloudflare.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: cloudflare.env.BETTER_AUTH_URL,
  });
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  return getAuth(context).handler(request);
}

export async function action({ request, context }: ActionFunctionArgs) {
  return getAuth(context).handler(request);
}
```

**Step 6: Register auth route in `app/routes.ts`**

```typescript
import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;
```

**Step 7: Generate Better Auth tables**

Manually create the migration SQL based on Better Auth's documented schema:

```sql
-- migrations/0002_better_auth.sql
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TEXT,
  "refreshTokenExpiresAt" TEXT,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "passkey" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "publicKey" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "credentialID" TEXT NOT NULL,
  "counter" INTEGER NOT NULL,
  "deviceType" TEXT NOT NULL,
  "backedUp" INTEGER NOT NULL DEFAULT 0,
  "transports" TEXT,
  "createdAt" TEXT NOT NULL,
  "aaguid" TEXT
);
```

Apply:
```bash
npx wrangler d1 migrations apply supersudoku-db --local
```

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: add Better Auth with passkey support"
```

---

## Phase 2: Puzzle Generation CLI

### Task 5: Sudoku solver engine (shared core)

**Files:**
- Create: `lib/sudoku/types.ts`
- Create: `lib/sudoku/solver.ts`
- Create: `lib/sudoku/utils.ts`
- Create: `lib/sudoku/solver.test.ts`

This is a shared library used by both the CLI tool and the app (for hints). Located at project root `lib/` not inside `app/` since the CLI needs it too.

**Step 1: Create types**

```typescript
// lib/sudoku/types.ts
export type Grid = number[][]; // 9x9, 0 = empty
export type Candidates = Set<number>[][]; // 9x9 sets of possible values

export type Technique =
  | "naked-single"
  | "hidden-single"
  | "naked-pair"
  | "naked-triple"
  | "naked-quad"
  | "hidden-pair"
  | "hidden-triple"
  | "hidden-quad"
  | "pointing-pairs"
  | "box-line-reduction"
  | "x-wing"
  | "swordfish"
  | "xy-wing"
  | "simple-coloring"
  | "jellyfish"
  | "unique-rectangle";

export interface SolveStep {
  technique: Technique;
  cells: [number, number][];      // affected cells [row, col]
  values: number[];                // values involved
  eliminations: { cell: [number, number]; value: number }[];
  placements: { cell: [number, number]; value: number }[];
  description: string;             // human-readable explanation
}

export interface SolveResult {
  solved: boolean;
  steps: SolveStep[];
  techniquesUsed: Set<Technique>;
  grid: Grid;
}

export const TECHNIQUE_WEIGHTS: Record<Technique, number> = {
  "naked-single": 1,
  "hidden-single": 2,
  "naked-pair": 4,
  "naked-triple": 4,
  "naked-quad": 8,
  "hidden-pair": 6,
  "hidden-triple": 6,
  "hidden-quad": 9,
  "pointing-pairs": 5,
  "box-line-reduction": 5,
  "x-wing": 10,
  "swordfish": 14,
  "xy-wing": 12,
  "simple-coloring": 13,
  "jellyfish": 18,
  "unique-rectangle": 15,
};

export const TECHNIQUE_CATEGORIES: Record<Technique, string> = {
  "naked-single": "Beginner",
  "hidden-single": "Beginner",
  "naked-pair": "Easy",
  "naked-triple": "Easy",
  "naked-quad": "Medium",
  "hidden-pair": "Medium",
  "hidden-triple": "Medium",
  "hidden-quad": "Medium",
  "pointing-pairs": "Medium",
  "box-line-reduction": "Medium",
  "x-wing": "Hard",
  "swordfish": "Hard",
  "xy-wing": "Hard",
  "simple-coloring": "Hard",
  "jellyfish": "Expert",
  "unique-rectangle": "Expert",
};
```

**Step 2: Create utils**

```typescript
// lib/sudoku/utils.ts
import type { Grid } from "./types";

export function parseGrid(s: string): Grid {
  const grid: Grid = [];
  for (let r = 0; r < 9; r++) {
    grid.push([]);
    for (let c = 0; c < 9; c++) {
      const ch = s[r * 9 + c];
      grid[r].push(ch === "." || ch === "0" ? 0 : parseInt(ch));
    }
  }
  return grid;
}

export function gridToString(grid: Grid): string {
  return grid.flat().map(v => v === 0 ? "." : String(v)).join("");
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}
```

**Step 3: Write failing test for basic constraint propagation**

```typescript
// lib/sudoku/solver.test.ts
import { describe, it, expect } from "vitest";
import { initCandidates, applyNakedSingle, applyHiddenSingle } from "./solver";
import { parseGrid } from "./utils";

describe("initCandidates", () => {
  it("should compute correct candidates for an empty cell", () => {
    const grid = parseGrid(
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
    );
    const candidates = initCandidates(grid);
    expect(candidates[0][2].has(5)).toBe(false);
    expect(candidates[0][2].has(3)).toBe(false);
  });
});

describe("nakedSingle", () => {
  it("should find a cell with only one candidate", () => {
    const grid = parseGrid(
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
    );
    const candidates = initCandidates(grid);
    const step = applyNakedSingle(grid, candidates);
    expect(step).not.toBeNull();
    expect(step!.technique).toBe("naked-single");
    expect(step!.placements.length).toBe(1);
  });
});
```

**Step 4: Run test to verify it fails**

```bash
npx vitest run lib/sudoku/solver.test.ts
```

Expected: FAIL — modules don't exist yet.

**Step 5: Implement solver core — candidate initialization + naked singles + hidden singles**

The solver core implements:
- `initCandidates(grid)` — compute all possible values per empty cell
- `applyNakedSingle(grid, candidates)` — find a cell with exactly one candidate
- `applyHiddenSingle(grid, candidates)` — find a candidate that appears only once in a unit
- `humanSolve(grid)` — apply techniques in order until solved or stuck

Each technique function has signature: `(grid: Grid, candidates: Candidates) => SolveStep | null`

**Step 6: Run tests, iterate until passing**

```bash
npx vitest run lib/sudoku/solver.test.ts
```

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: add sudoku solver core with naked/hidden singles"
```

---

### Task 6: Implement remaining solving techniques

**Files:**
- Modify: `lib/sudoku/solver.ts`
- Modify: `lib/sudoku/solver.test.ts`

Implement each technique with its own test. Order of implementation:

1. **Naked Pair/Triple** — find N cells in a unit with exactly N shared candidates, eliminate from peers
2. **Hidden Pair/Triple** — find N candidates that appear in only N cells in a unit
3. **Pointing Pairs** — candidates in a box restricted to one row/col, eliminate from rest of row/col
4. **Box/Line Reduction** — candidates in a row/col restricted to one box, eliminate from rest of box
5. **Naked/Hidden Quad** — extension of pair/triple to 4 cells
6. **X-Wing** — 2 rows where a candidate appears in exactly 2 cols (same cols), eliminate from those cols
7. **Swordfish** — 3-row extension of X-Wing
8. **XY-Wing** — pivot cell with 2 candidates, 2 wing cells forming elimination pattern
9. **Simple Coloring** — alternating chain of a single candidate, find contradictions
10. **Jellyfish** — 4-row extension of X-Wing
11. **Unique Rectangle** — exploit uniqueness constraint to eliminate candidates

For each technique, use known puzzle examples from the sudoku community (e.g., Andrew Stuart's solver examples).

**Step 1 (per technique): Write failing test with a grid that requires the technique**

**Step 2 (per technique): Implement the technique**

**Step 3 (per technique): Run test, verify pass**

**Step 4: Commit after every 2-3 techniques**

```bash
git add -A && git commit -m "feat: add [technique names] to solver"
```

---

### Task 7: Human-strategy solver and difficulty grading

**Files:**
- Create: `lib/sudoku/grader.ts`
- Create: `lib/sudoku/grader.test.ts`

**Step 1: Write failing test**

```typescript
// lib/sudoku/grader.test.ts
import { describe, it, expect } from "vitest";
import { gradePuzzle, difficultyLabel } from "./grader";
import { parseGrid } from "./utils";

describe("gradePuzzle", () => {
  it("should give a low score to an easy puzzle", () => {
    const grid = parseGrid("...easy puzzle string...");
    const result = gradePuzzle(grid);
    expect(result.score).toBeLessThan(20);
    expect(result.label).toBe("Beginner");
    expect(result.solved).toBe(true);
  });
});

describe("difficultyLabel", () => {
  it("maps score ranges correctly", () => {
    expect(difficultyLabel(10)).toBe("Beginner");
    expect(difficultyLabel(25)).toBe("Easy");
    expect(difficultyLabel(45)).toBe("Medium");
    expect(difficultyLabel(65)).toBe("Hard");
    expect(difficultyLabel(85)).toBe("Expert");
  });
});
```

**Step 2: Implement grader**

```typescript
// lib/sudoku/grader.ts
import type { Grid, Technique, SolveStep } from "./types";
import { TECHNIQUE_WEIGHTS } from "./types";
import { humanSolve } from "./solver";

export interface GradeResult {
  score: number;           // 0-100
  label: string;
  solved: boolean;
  steps: SolveStep[];
  techniquesUsed: Technique[];
}

export function gradePuzzle(grid: Grid): GradeResult {
  const result = humanSolve(grid);
  const techniques = [...result.techniquesUsed];
  const clueCount = grid.flat().filter(v => v > 0).length;

  const maxWeight = Math.max(0, ...techniques.map(t => TECHNIQUE_WEIGHTS[t]));
  const totalUses = result.steps.reduce((sum, s) => sum + TECHNIQUE_WEIGHTS[s.technique], 0);

  const raw = maxWeight * 3 + totalUses * 0.5 + (81 - clueCount) * 0.3;

  // Normalize to 0-100 (calibrated empirically — max realistic raw is ~120)
  const score = Math.min(100, Math.round((raw / 120) * 100));

  return {
    score,
    label: difficultyLabel(score),
    solved: result.solved,
    steps: result.steps,
    techniquesUsed: techniques,
  };
}

export function difficultyLabel(score: number): string {
  if (score <= 15) return "Beginner";
  if (score <= 35) return "Easy";
  if (score <= 55) return "Medium";
  if (score <= 75) return "Hard";
  return "Expert";
}
```

**Step 3: Run tests**

```bash
npx vitest run lib/sudoku/grader.test.ts
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add difficulty grading with technique-based scoring"
```

---

### Task 8: Puzzle generator

**Files:**
- Create: `lib/sudoku/generator.ts`
- Create: `lib/sudoku/generator.test.ts`

**Step 1: Write failing test**

```typescript
// lib/sudoku/generator.test.ts
import { describe, it, expect } from "vitest";
import { generatePuzzle, hasUniqueSolution } from "./generator";

describe("generatePuzzle", () => {
  it("should generate a puzzle with exactly one solution", () => {
    const { puzzle, solution } = generatePuzzle();
    expect(puzzle.flat().filter(v => v === 0).length).toBeGreaterThan(0);
    expect(solution.flat().filter(v => v === 0).length).toBe(0);
    expect(hasUniqueSolution(puzzle)).toBe(true);
  }, 30000); // generation can be slow
});
```

**Step 2: Implement generator**

The generator:
1. Creates a solved grid via randomized backtracking
2. Removes clues one at a time in shuffled order
3. After each removal, verifies exactly one solution remains
4. Stops when no more clues can be removed without breaking uniqueness

Key functions: `generateSolvedGrid()`, `generatePuzzle()`, `hasUniqueSolution()`, `countSolutions()` (short-circuits at 2).

**Step 3: Run tests, iterate**

```bash
npx vitest run lib/sudoku/generator.test.ts
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add puzzle generator with unique-solution verification"
```

---

### Task 9: CLI tool for batch generation + upload

**Files:**
- Create: `tools/generate.ts`
- Create: `tools/upload.ts`

**Step 1: Create generate CLI**

A Node script that:
- Accepts `--count`, `--min`, `--max`, `--output` args
- Generates puzzles in a loop, grading each one
- Filters by difficulty range
- Writes JSON output file

**Step 2: Create upload CLI**

A Node script that:
- Reads the JSON file
- Batches puzzles (50 per batch)
- Uses `wrangler d1 execute` to insert into D1 (local or remote via `--remote` flag)
- Uses parameterized queries or properly escaped values to prevent SQL injection

**Step 3: Test locally**

```bash
npx tsx tools/generate.ts --count=10 --output=test-puzzles.json
npx tsx tools/upload.ts --file=test-puzzles.json --db=supersudoku-db
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add CLI tools for puzzle generation and upload"
```

---

## Phase 3: Core UI — The Sudoku Board

### Task 10: Create the sudoku board component

**Files:**
- Create: `app/components/sudoku/board.tsx`
- Create: `app/components/sudoku/cell.tsx`
- Create: `app/components/sudoku/number-pad.tsx`
- Create: `app/components/sudoku/types.ts`

**Step 1: Create game types**

```typescript
// app/components/sudoku/types.ts
export interface GameState {
  puzzleId: string;
  initial: number[];    // 81 values, 0 = blank (immutable)
  current: number[];    // 81 values, current board state
  solution: number[];   // 81 values
  notes: Map<number, Set<number>>; // cell index -> set of pencil marks
  centerNotes: Map<number, Set<number>>; // cell index -> center marks
  selectedCell: number | null;
  history: HistoryEntry[];
  historyIndex: number;
  timer: number;        // seconds elapsed
  isComplete: boolean;
  difficultyScore: number;
  difficultyLabel: string;
}

export interface HistoryEntry {
  cellIndex: number;
  prevValue: number;
  newValue: number;
  prevNotes: Set<number> | null;
  newNotes: Set<number> | null;
  type: "value" | "note" | "center-note";
}

export interface GameSettings {
  autoRemoveNotes: boolean;
  highlightMatching: boolean;
  showErrors: boolean;
  showCandidates: boolean;
  hintsEnabled: boolean;
}
```

**Step 2: Create Cell component**

A button element per cell that:
- Displays the value or pencil marks (corner notes as 3x3 grid, center notes as inline text)
- Highlights based on selection, matching number, and error state
- Has proper box borders (thicker on 3x3 boundaries)
- Is accessible (aria-label with position and value)

**Step 3: Create Board component**

A 9x9 CSS grid that renders 81 Cell components with correct highlight state computed from GameState + GameSettings.

**Step 4: Create NumberPad component**

- Mode toggle: Value / Corner / Center
- Number buttons 1-9 + Delete
- Mobile-friendly layout (grid of buttons)

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add core sudoku board, cell, and number pad components"
```

---

### Task 11: Game state hook (useGame)

**Files:**
- Create: `app/hooks/use-game.ts`

**Step 1: Implement the hook**

The `useGame` hook manages all game state:

- **Initialization:** From puzzle data or resume state (board + notes + timer)
- **Cell selection:** Click/tap to select, arrow keys to navigate
- **Value entry:** Place number in selected cell (if not initial), push to history
- **Note toggling:** Toggle pencil marks in corner/center mode
- **Auto-remove notes:** When placing a value, remove that candidate from all peers (row/col/box) if setting enabled
- **Undo/redo:** Navigate history stack with Ctrl+Z / Ctrl+Y
- **Keyboard input:** 1-9 for entry, Backspace/Delete to clear, arrow keys for navigation
- **Timer:** 1-second interval, pauses on `document.hidden`
- **Completion detection:** Check if all cells match solution
- **Debounced save:** Call `onSave` callback 500ms after last state change

Returns: `{ game, selectCell, enterNumber, deleteValue, undo, redo, mode, setMode }`

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add useGame hook for game state management"
```

---

### Task 12: Play route

**Files:**
- Create: `app/routes/play.$puzzleId.tsx`
- Create: `app/routes/api.game.save.ts`
- Modify: `app/routes.ts`

**Step 1: Add routes to routes.ts**

```typescript
route("play/:puzzleId", "routes/play.$puzzleId.tsx"),
route("api/game/save", "routes/api.game.save.ts"),
```

**Step 2: Implement play route loader**

- Fetch puzzle from D1 by ID
- Check for existing progress (if signed in, query userStats)
- Return puzzle data + optional resume state

**Step 3: Implement play route component**

- Render Board + NumberPad + Timer + Undo/Redo buttons
- Wire up `useGame` hook with puzzle data from loader
- Save handler: POST to `/api/game/save` if signed in, localStorage if anonymous
- Completion UI: show time, difficulty, techniques when puzzle solved

**Step 4: Implement save API action**

- Accepts POST with `{ puzzleId, boardState, notesSnapshot, timeSeconds, completed }`
- Requires auth (returns 401 if not signed in)
- Upserts into userStats table

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add play route with board rendering and save API"
```

---

### Task 13: Home route — difficulty picker + new puzzle

**Files:**
- Create: `app/routes/home.tsx`
- Create: `app/routes/api.puzzle.random.ts`
- Modify: `app/routes.ts`

**Step 1: Implement home route**

- SSR'd page with app title, difficulty slider (0-100 with label markers), "New Puzzle" button
- Slider selects a range; button fetches a random puzzle in that range and navigates to `/play/:id`
- Show puzzle counts per difficulty bracket (loaded via loader)

**Step 2: Create random puzzle API**

- GET endpoint accepting `?min=X&max=Y` query params
- Queries D1 for a random puzzle in the difficulty range
- Returns `{ puzzleId }` JSON

**Step 3: Register routes, commit**

```bash
git add -A && git commit -m "feat: add home route with difficulty slider and random puzzle API"
```

---

### Task 14: Hint system

**Files:**
- Create: `app/lib/hints.ts`
- Modify: `app/components/sudoku/board.tsx` (add hint overlay)

**Step 1: Create hint engine**

Takes the current board state as a flat array, converts to Grid, runs the human-strategy solver for exactly one step, returns the `SolveStep` with cell highlights and technique name.

**Step 2: Add hint button + overlay to play UI**

- "Hint" button (only visible if hints enabled in settings)
- On click: compute next step, highlight relevant cells with a different color, show technique name + description in a tooltip/card
- Include "Learn this technique" link to `/bible/:technique`

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add hint system using human-strategy solver"
```

---

## Phase 4: Solving Bible

### Task 15: Bible index route

**Files:**
- Create: `app/routes/bible.tsx`
- Create: `app/data/bible.ts`
- Modify: `app/routes.ts`

**Step 1: Create bible technique data**

```typescript
// app/data/bible.ts
export interface TechniqueInfo {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
}

export const techniques: TechniqueInfo[] = [
  { slug: "naked-single", name: "Naked Single", category: "Beginner", shortDescription: "A cell with only one possible candidate." },
  { slug: "hidden-single", name: "Hidden Single", category: "Beginner", shortDescription: "A candidate that appears in only one cell within a unit." },
  // ... all 14 techniques
];
```

**Step 2: Create bible index page**

SSR'd page listing all techniques grouped by category (Beginner, Easy, Medium, Hard, Expert), each linking to `/bible/:slug`. Clean card layout.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add solving bible index page"
```

---

### Task 16: Interactive technique tutorial component

**Files:**
- Create: `app/components/bible/tutorial-board.tsx`
- Create: `app/components/bible/step-controls.tsx`
- Create: `app/data/bible-tutorials.ts`

**Step 1: Define tutorial data format**

```typescript
// app/data/bible-tutorials.ts
export interface TutorialStep {
  description: string;
  highlightCells: number[];
  highlightCandidates: { cell: number; values: number[] }[];
  eliminateCandidates: { cell: number; values: number[] }[];
  placementCells: { cell: number; value: number }[];
}

export interface TutorialData {
  technique: string;
  boardState: number[];
  candidates: Record<number, number[]>;
  steps: TutorialStep[];
  tryItYourselfBoard: number[];
  tryItYourselfAnswer: { cell: number; value: number }[];
}
```

**Step 2: Create TutorialBoard component**

A specialized board that:
- Accepts pre-set board state + candidate state
- Has step-through controls (Next/Previous/Reset)
- Highlights cells and candidates per step (different colors for highlight vs eliminate)
- Shows step description in a card below the board
- Has "Try it yourself" mode: board resets, user applies the technique with validation

**Step 3: Create tutorial fixtures for each technique**

Hand-craft JSON data in `app/data/tutorials/` — one file per technique. Each contains a board state that cleanly demonstrates the technique.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add interactive tutorial board component"
```

---

### Task 17: Individual technique pages

**Files:**
- Create: `app/routes/bible.$technique.tsx`
- Modify: `app/routes.ts`

**Step 1: Register route**

```typescript
route("bible", "routes/bible.tsx"),
route("bible/:technique", "routes/bible.$technique.tsx"),
```

**Step 2: Create technique route**

SSR'd page that:
- Looks up technique by slug param
- Renders explanation prose (what, when, why)
- Loads and renders the interactive TutorialBoard
- Includes "Try it yourself" section

**Step 3: Write explanation content for all 14 techniques**

Each includes:
- What it is (1-2 paragraphs)
- When to use it (pattern recognition tips)
- Why it works (logical proof in plain language)

**Step 4: Commit per batch of 3-4 techniques**

```bash
git add -A && git commit -m "feat: add bible pages for [technique names]"
```

---

## Phase 5: Auth, Sync & Settings

### Task 18: Sign-in page with passkeys

**Files:**
- Create: `app/routes/auth.signin.tsx`
- Modify: `app/routes.ts`

**Step 1: Create sign-in page**

- Warm, approachable design — not a typical auth form
- "Sign in with passkey" button (calls `authClient.signIn.passkey()`)
- "Create account" flow for new users (register passkey)
- Explain the value: "Sign in to sync your puzzles and stats across devices"

**Step 2: Add auth state to root layout**

- Root loader checks session via Better Auth
- Header shows "Sign in" link or user name
- Auth context available to all routes

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add passkey sign-in page"
```

---

### Task 19: Anonymous to signed-in migration

**Files:**
- Create: `app/routes/api.sync.migrate.ts`
- Create: `app/lib/sync.ts`

**Step 1: Create migration endpoint**

- Accepts POST with localStorage data: `{ currentGame, settings, completedPuzzles }`
- Merges into D1 for the authenticated user (upserts to avoid duplicates)

**Step 2: Create client-side migration logic**

- After successful sign-in, check localStorage for existing data
- If found, POST to migration endpoint
- On success, clear synced localStorage keys

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add anonymous to authenticated data migration"
```

---

### Task 20: Settings page

**Files:**
- Create: `app/routes/settings.tsx`
- Create: `app/routes/api.settings.ts`
- Modify: `app/routes.ts`

**Step 1: Create settings page**

Toggle switches for all assists:
- Auto-remove notes (on/off)
- Highlight matching numbers (on/off)
- Show errors (on/off)
- Show candidates (on/off)
- Hints enabled (on/off)
- Theme: warm light / warm dark

Account section:
- If signed in: manage passkeys, sign out button
- If anonymous: prompt to sign in for cross-device sync

**Step 2: Settings persistence**

- Save to localStorage immediately on toggle
- If signed in, also sync to D1 via API endpoint
- Load from D1 on sign-in (D1 wins on conflict)

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add settings page with assist toggles"
```

---

## Phase 6: Stats

### Task 21: Stats page

**Files:**
- Create: `app/routes/stats.tsx`
- Modify: `app/routes.ts`

**Step 1: Create stats loader**

- If signed in: query D1 for completed puzzles, aggregate stats
- If anonymous: return empty (client will load from localStorage)

**Step 2: Create stats UI**

- Total puzzles completed
- Average completion time (overall + by difficulty bracket)
- Completion time trend chart (last 30 puzzles) — simple SVG line chart or recharts
- Distribution by difficulty (bar chart)
- Best times per difficulty bracket
- In-progress puzzle with "Resume" link

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add personal stats page"
```

---

## Phase 7: Warm Theme & Polish

### Task 22: Warm & approachable theme

**Files:**
- Modify: `app/app.css`

**Step 1: Customize shadcn CSS variables for warm palette**

```css
:root {
  --background: 30 30% 98%;       /* warm off-white */
  --foreground: 20 15% 15%;       /* warm dark brown */
  --card: 30 25% 96%;
  --primary: 25 60% 45%;          /* warm terracotta */
  --primary-foreground: 30 30% 98%;
  --muted: 30 15% 92%;
  --muted-foreground: 20 10% 45%;
  --accent: 35 40% 90%;           /* soft warm highlight */
  --border: 25 15% 85%;
  --ring: 25 60% 45%;
  --radius: 0.75rem;
}

.dark {
  --background: 20 15% 10%;
  --foreground: 30 15% 90%;
  --card: 20 15% 13%;
  --primary: 25 55% 55%;
  --muted: 20 10% 18%;
  --muted-foreground: 20 10% 60%;
  --border: 20 10% 20%;
}
```

**Step 2: Add warm typography — friendly font (Inter or Nunito)**

**Step 3: Polish all components — rounded corners, soft shadows, comfortable spacing**

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: apply warm approachable theme"
```

---

### Task 23: Responsive design + mobile UX

**Files:**
- Modify: Various component files

**Step 1: Board scales on mobile** — max-width constraint, touch targets minimum 44px

**Step 2: Number pad is mobile-first** — fixed to bottom of screen on mobile, thumb-friendly spacing

**Step 3: Test on mobile viewport sizes (375px, 390px, 414px widths)**

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: responsive mobile layout"
```

---

### Task 24: Navigation layout

**Files:**
- Create: `app/components/layout/header.tsx`
- Create: `app/components/layout/nav.tsx`
- Modify: `app/root.tsx`

**Step 1: Create minimal header** — Logo/title, nav links (Play, Bible, Stats, Settings), auth status

**Step 2: Wire into root layout**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add navigation layout with header"
```

---

## Phase 8: Testing & Deploy

### Task 25: Integration tests

**Files:**
- Create: `tests/` directory

Note: `@cloudflare/vitest-pool-workers` has known conflicts with React Router v7. Use standard Vitest for component/logic tests. For D1 integration tests, use Miniflare directly or test via the dev server.

**Step 1: Solver engine tests** — already done in Tasks 5-7

**Step 2: API route tests** — mock D1 or use Miniflare

**Step 3: Game state hook tests** — render hook tests with `@testing-library/react`

**Step 4: Commit**

```bash
git add -A && git commit -m "test: add integration tests"
```

---

### Task 26: Deploy

**Step 1: Set production secrets**

```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL
```

**Step 2: Apply migrations to remote D1**

```bash
npx wrangler d1 migrations apply supersudoku-db --remote
```

**Step 3: Generate and upload initial puzzle batch**

```bash
npx tsx tools/generate.ts --count=500 --output=initial-puzzles.json
npx tsx tools/upload.ts --file=initial-puzzles.json --db=supersudoku-db --remote
```

**Step 4: Deploy**

```bash
npm run deploy
```

**Step 5: Verify in production** — load home page, start a puzzle, check bible pages

**Step 6: Commit any deploy fixes**

```bash
git add -A && git commit -m "chore: production deploy configuration"
```

---

## Summary

| Phase | Tasks | What it delivers |
|---|---|---|
| 1: Scaffolding | 1-4 | Working RR7 + CF Worker + shadcn + D1 + auth |
| 2: Puzzle Engine | 5-9 | Solver, grader, generator, CLI tools |
| 3: Core UI | 10-14 | Playable sudoku with full assists |
| 4: Bible | 15-17 | 14 interactive technique tutorials |
| 5: Auth & Sync | 18-20 | Passkey accounts, cross-device sync, settings |
| 6: Stats | 21 | Personal tracking dashboard |
| 7: Theme | 22-24 | Warm polish, responsive, navigation |
| 8: Ship | 25-26 | Tests + production deploy |
