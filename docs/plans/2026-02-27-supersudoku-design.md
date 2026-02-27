# SUPERSudoku — Design Document

## Vision

A pure sudoku app. No gamification, no leaderboards, no streaks. Just excellent puzzle generation, accurate difficulty grading, a comprehensive interactive solving bible, and a warm, approachable interface. Optional passkey accounts enable cross-device sync.

## Stack

- **Runtime:** Cloudflare Workers
- **Framework:** React Router v7 (framework mode, SSR)
- **UI:** shadcn/ui, warm & approachable theme
- **Database:** Cloudflare D1
- **Auth:** Better Auth with passkeys (optional accounts)
- **Puzzle generation:** Local CLI tool, offline

## Architecture: Monolith Worker

Single Cloudflare Worker serves the React Router v7 app (SSR + SPA). D1 stores puzzles, user data, stats, and settings. Better Auth runs server-side in the Worker. Local CLI generates puzzles and uploads to D1.

## Data Model (D1)

### Puzzles

| Column | Type | Description |
|---|---|---|
| id | text (ULID) | Primary key |
| puzzle | text | 81-char string (digits + dots for blanks) |
| solution | text | 81-char string |
| difficulty_score | real | 0-100 continuous score |
| difficulty_label | text | Derived: Beginner/Easy/Medium/Hard/Expert |
| techniques_required | text | JSON array of technique names |
| clue_count | integer | Number of given digits |
| created_at | text | ISO timestamp |

### Users

Managed by Better Auth — creates `user`, `session`, `account`, `verification`, `passkey` tables automatically.

### User Stats

| Column | Type | Description |
|---|---|---|
| id | text (ULID) | Primary key |
| user_id | text | FK to user |
| puzzle_id | text | FK to puzzle |
| started_at | text | ISO timestamp |
| completed_at | text | Nullable, ISO timestamp |
| time_seconds | integer | Nullable, elapsed time |
| assists_used | text | JSON — which assists were active |
| notes_snapshot | text | JSON — pencil marks for resume |
| board_state | text | 81-char current state for resume |

### User Settings

| Column | Type | Description |
|---|---|---|
| id | text | Primary key |
| user_id | text | FK to user |
| settings | text | JSON — theme, assist toggles, etc. |

### Difficulty Label Ranges (in code)

- 0-15: Beginner
- 16-35: Easy
- 36-55: Medium
- 56-75: Hard
- 76-100: Expert

## Puzzle Generation & Difficulty Grading

### Local CLI tool (`tools/generate/`)

**Generation algorithm:**

1. Build a solved grid via backtracking with randomized candidate selection
2. Remove clues one at a time in random order
3. After each removal, verify exactly one solution remains (constraint propagation + backtracking)
4. Stop when target difficulty range is reached or uniqueness would break

**Difficulty scoring — human-strategy solver:**

A solver that applies techniques in order of difficulty, scoring based on what's required:

| Technique | Score Weight | Category |
|---|---|---|
| Naked Single | 1 | Beginner |
| Hidden Single | 2 | Beginner |
| Naked Pair/Triple | 4 | Easy |
| Hidden Pair/Triple | 6 | Medium |
| Pointing Pairs | 5 | Medium |
| Box/Line Reduction | 5 | Medium |
| X-Wing | 10 | Hard |
| Swordfish | 14 | Hard |
| XY-Wing | 12 | Hard |
| Simple Coloring | 13 | Hard |
| Naked Quad | 8 | Medium |
| Hidden Quad | 9 | Medium |
| Jellyfish | 18 | Expert |
| Unique Rectangle | 15 | Expert |

**Scoring formula:** `score = (max_technique_weight * 3 + sum_of_all_technique_uses * 0.5 + (81 - clue_count) * 0.3)` normalized to 0-100.

Difficulty is primarily the hardest technique required, secondarily the count of hard steps, and tertiary clue count.

**CLI workflow:**

```
npx tsx tools/generate --count 500 --min-difficulty 0 --max-difficulty 100
npx tsx tools/upload --db supersudoku-db --file puzzles.json
```

## Routes

```
/                       → Home — difficulty slider, start new puzzle
/play/:puzzleId         → Play screen — sudoku board
/bible                  → Technique bible index
/bible/:technique       → Individual technique interactive tutorial
/stats                  → Personal stats
/settings               → Assist toggles, theme, account management
/auth/signin            → Better Auth passkey sign-in/register
```

- Home and bible pages are SSR'd for fast load and SEO.
- Play screen is client-side after initial load.
- Anonymous users use localStorage. Signing in migrates data to D1.

## Play Experience

### Board

- 9x9 grid with standard 3x3 box borders, warm color palette
- Selected cell highlighted, same-number cells highlighted across board
- Keyboard input (1-9, delete) + on-screen number pad for mobile
- Touch-friendly — tap to select, tap number to place

### Assist Toolkit (all toggleable in settings)

- **Pencil notes** — corner marks (candidates) and center marks
- **Auto-remove notes** — placing a number removes that candidate from peers
- **Highlight matching** — selecting a "5" highlights all 5s
- **Error checking** — optionally highlight conflicts in real-time
- **Hint system** — identifies next logical step, names the technique, highlights cells, links to bible
- **Undo/redo** — full move stack, unlimited
- **Candidate visualization** — show all possible candidates for empty cells

### Saving

- Every move saves to D1 (debounced 500ms) when signed in
- Anonymous users save to localStorage with same pattern
- Offline resilience: write locally first, sync to D1. Queue and retry on failure.

### Timer

Counts up, pauses on navigate away, stored with game state. Displayed but not intrusive.

### Completion

Show time, difficulty score, techniques in the puzzle. Simple, no fireworks.

## Solving Bible (Interactive Tutorials)

### Structure

Techniques organized by category (Beginner → Expert), matching difficulty tiers.

### Each technique page

1. **Explanation** — what, when, why (SSR'd prose)
2. **Interactive demo board** — purpose-built board state demonstrating the technique
3. **Step-through controls** — Next/Previous buttons highlighting cells and showing deductions
4. **Try it yourself** — board resets, user applies technique with validation feedback

### Technique Catalog (14 techniques, 5 tiers)

1. **Beginner:** Naked Single, Hidden Single
2. **Easy:** Naked Pair, Naked Triple
3. **Medium:** Hidden Pair, Hidden Triple, Pointing Pairs, Box/Line Reduction, Naked Quad, Hidden Quad
4. **Hard:** X-Wing, Swordfish, XY-Wing, Simple Coloring
5. **Expert:** Jellyfish, Unique Rectangle

Tutorial data is hand-crafted JSON fixtures stored in the codebase, not D1.

### Hint Integration

During play, hints include a "Learn this technique" link to the relevant bible page.

## Authentication & Cross-Device Sync

- **Better Auth passkey-only** — no email/password
- Session cookie for auth state
- **Anonymous → signed in migration:** localStorage data merged into D1 on first sign-in
- **Resume on any device:** `/play/:puzzleId` checks D1 for existing progress
- **Settings sync:** assist toggles, theme saved to D1 when signed in

## Stats & Personal Tracking

### Per completed puzzle

- Time, difficulty score, assists enabled, date

### Stats page

- Total puzzles completed
- Average completion time (overall + by difficulty bracket)
- Completion time trend (last 30 puzzles, line chart)
- Distribution by difficulty (bar chart)
- Best times per difficulty bracket
- Current in-progress puzzle with "Resume" link

### Charts

Lightweight — recharts or hand-rolled SVG.

### No gamification

No streaks, achievements, or leaderboards. Personal log only.

## Visual Style

Warm & approachable — soft colors, rounded corners, warm tones. Like a cozy puzzle book.
