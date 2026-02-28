# PWA Installability & Offline Support Design

## Goal

Make Super Sudoku installable on iPhone and Android with full offline support, including the ability to start new puzzles without internet.

## Architecture

The entire puzzle bank is ~470KB uncompressed (~200KB gzipped) — small enough to cache everything. A hand-written service worker caches the app shell and all puzzle data. No library (Workbox) needed given the simple caching requirements.

## Components

### 1. Web App Manifest (`public/manifest.webmanifest`)

- App name: "Super Sudoku"
- Short name: "Sudoku"
- Display: `standalone`
- Theme/background colors matching CSS variables (light: `hsl(40 30% 97%)`, dark: `hsl(30 8% 10%)`)
- Icons at 192x192, 512x512, and 180x180 (apple-touch-icon)
- Start URL: `/`
- Scope: `/`

### 2. App Icons

Generate PNG icons from the existing Logo SVG component at:
- `public/icon-192.png` (Android)
- `public/icon-512.png` (Android splash)
- `public/apple-touch-icon.png` (180x180, iOS)

The logo is a 3x3 abstract grid with filled cells at varying opacities. Icons will use the primary color (`hsl(220 25% 50%)`) on the background color.

### 3. Service Worker (`public/sw.js`)

**Install phase:**
- Precache app shell: HTML entry, CSS/JS bundles
- Fetch and cache `/api/puzzles/all` (entire puzzle bank)

**Fetch strategy:**
- Static assets (JS, CSS, fonts, images): cache-first
- `/api/puzzles/all`: cache-first (refreshed periodically)
- `/api/puzzle/random`: network-first, offline fallback selects from cached puzzle bank
- Play page loader data: network-first, offline fallback from cached puzzles
- Auth/stats APIs: network-only (graceful failure offline)

**Update flow:**
- New service worker version triggers `skipWaiting` + `clients.claim`
- Cache version bumped with each deploy

### 4. New API Route: `/api/puzzles/all`

Returns all puzzles as a JSON array with fields needed for gameplay:
- `id`, `puzzle`, `solution`, `difficultyScore`, `difficultyLabel`, `techniquesRequired`

### 5. Root Layout Changes (`app/root.tsx`)

Add to `<head>`:
- `<link rel="manifest" href="/manifest.webmanifest">`
- `<meta name="theme-color" content="...">`
- `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`

Add service worker registration script (inline, after page load).

### 6. Offline-Aware Puzzle Selection (`app/routes/home.tsx`)

When `/api/puzzle/random` fails (offline), the client:
1. Opens the service worker cache
2. Reads the cached `/api/puzzles/all` response
3. Filters by selected difficulty range
4. Picks a random puzzle
5. Navigates to `/play/{puzzleId}`

The play route loader similarly falls back to cached puzzle data when the network is unavailable.

## Offline Behavior

| Feature | Online | Offline |
|---------|--------|---------|
| Home page | Normal | From cache |
| New puzzle | API call | Client-side from cache |
| Play puzzle | API + DB | From cached puzzle bank |
| Save progress | Server + localStorage | localStorage only |
| Sign in/up | Works | Unavailable |
| Stats page | API | Cached if previously visited |
| Bible/techniques | API | Cached if previously visited |

## What Won't Work Offline

- Authentication (sign in/sign up)
- Syncing progress to server (queued until online)
- Stats that haven't been previously loaded
