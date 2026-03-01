# Super Sudoku — TODO

## Bugs & TypeScript Errors

- [x] Fix `request.json()` returning `unknown` in `api.game.save.ts` — add a typed interface and cast the body
- [x] Fix `request.json()` returning `unknown` in `api.sync.migrate.ts` — same pattern
- [x] Fix `tsconfig.cloudflare.json` not including `lib/sudoku/*` — the solver/types/utils files are imported by app code but not listed in the project's `include`, causing TS6307 errors
- [x] `api.game.save.ts` has no input validation — a malformed or malicious body goes straight to the database
- [x] `api.sync.migrate.ts` has no input validation either

## Game UX

- [x] Completing a puzzle shows no "New Puzzle" button — user has to go Home and select difficulty again
- [ ] No streak tracking or daily challenge to drive retention
- [ ] No difficulty shown on the play page header when offline (ErrorBoundary path shows it, but the value comes from cache which may not have `difficultyLabel`)
- [x] Timer keeps running while completion card is visible — it should stop the moment the puzzle is solved
- [x] Corner notes and center notes can coexist on the same cell which is confusing — consider clearing one when the other is set
- [ ] No confirmation before navigating away from an in-progress puzzle (easy to lose progress by hitting Back)
- [ ] The "Resume puzzle" card on home only shows the most recent in-progress game — if a user abandons one and starts another, the old one is invisible
- [x] No way to restart/reset a puzzle without refreshing

## Auth & Account

- [ ] Registration flow uses `crypto.randomUUID()` as password — this means users can never sign in with email+password, only passkeys. If they switch devices without passkey sync they're locked out
- [ ] No account deletion or data export (GDPR)
- [ ] No "forgot passkey" recovery flow — if passkey is lost, account is unrecoverable
- [ ] Passkey registration failure during signup is silently swallowed with `console.warn` — user has an account but no way to sign in again
- [ ] Header sign-in link not visible enough — easy to miss

## Offline & PWA

- [ ] Service worker precaches hardcoded asset paths (`/assets/...`) — these will be wrong after every deploy since Vite generates hashed filenames. SW needs to be generated at build time or use a build manifest
- [ ] No "update available" prompt when a new service worker is installed — app could serve stale code indefinitely
- [ ] No offline indicator in the UI — user doesn't know if they're online or offline
- [ ] `sw.js` tries to cache `/` during install but the HTML is server-rendered with user-specific data — cache could serve stale/wrong user context
- [ ] Theme color in manifest is hardcoded light (`#f7f4f0`) — doesn't adapt for dark mode users

## Data & Persistence

- [ ] Game saves fire-and-forget to the server with no retry — if the save fails (network blip), progress is lost unless localStorage fallback works
- [ ] No queued/synced saves — offline changes saved to localStorage are never synced back to the server when coming online
- [x] `localStorage` progress loading on play page mount is a no-op (lines 241-252 in `play.$puzzleId.tsx` — reads but doesn't use the data)
- [x] Settings sync failure is completely silent — `.catch(() => {})` in settings.tsx
- [ ] Anonymous users' stats are localStorage-only and can't be recovered if cleared

## Testing

- [ ] No route/integration tests — loaders, actions, and page rendering are untested
- [ ] No API endpoint tests (`api.game.save`, `api.puzzle.random`, `api.puzzles.all`, `api.sync.migrate`)
- [ ] No UI component tests (Board, Cell, NumberPad)
- [ ] No E2E tests — critical flows like "select difficulty → start puzzle → solve → complete" are untested
- [ ] No test for the offline fallback paths (home.tsx `getOfflineRandomPuzzle`, play page ErrorBoundary)
- [ ] Auth flow has no tests

## Performance

- [ ] `/api/puzzles/all` returns every puzzle on every request — ~470KB uncompressed. Should use ETags or `304 Not Modified` to avoid re-downloading
- [x] Stats page builds SVG charts client-side on every render — could memoize
- [ ] `useGame` hook is 750 lines with a large reducer — could be split into smaller composable hooks
- [ ] No code splitting — entire app loads as one bundle

## Code Quality

- [x] `formatTime()` is duplicated in 3 files (`home.tsx`, `play.$puzzleId.tsx`, `stats.tsx`)
- [x] Auth setup (`createAuth(...)`) is repeated in every loader — could be middleware or a shared helper that also handles the try/catch
- [x] `DIFFICULTY_RANGES` and `DIFFICULTIES` are defined in home.tsx but also needed conceptually in other places (stats, grader)
- [ ] D1 compatibility proxy in `auth.server.ts` is a fragile workaround — should track upstream better-auth fix
- [x] No consistent error response format across API routes

## Accessibility

- [x] Number pad buttons lack aria-labels — screen reader says "1" but not "Enter 1" or "Toggle note 1"
- [x] No skip-to-content link
- [ ] Stats SVG charts have `aria-label` on the container but chart data isn't accessible to screen readers
- [ ] Color-only indicators for errors (red) — no icon or pattern for colorblind users
- [ ] Focus management after puzzle completion — focus doesn't move to the completion card

## Design & Polish

- [ ] Bible/learn technique pages could link back to related puzzles that use that technique
- [ ] No onboarding — new users land on a difficulty selector with no context
- [ ] No haptic feedback on mobile when entering numbers
- [ ] No sound effects (optional — some users like audio feedback)
- [ ] Completion celebration is minimal — just a card. Could add confetti or animation
- [ ] No social sharing ("I solved a Hard puzzle in 4:32")
- [ ] Stats page is empty and unhelpful for new users with 0 completed puzzles

## Infrastructure

- [ ] No CI/CD pipeline — no automated tests, typecheck, or deploy on push
- [ ] No error monitoring (Sentry, LogRocket, etc.)
- [ ] No analytics — no way to know which features are used or where users drop off
- [ ] No rate limiting on API endpoints
- [ ] No CSP headers
