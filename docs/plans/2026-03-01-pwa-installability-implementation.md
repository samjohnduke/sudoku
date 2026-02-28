# PWA Installability & Offline Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Super Sudoku installable on iPhone/Android with full offline support including pre-cached puzzle bank.

**Architecture:** Hand-written service worker caches app shell + all 1,100 puzzles (~200KB gzipped). New `/api/puzzles/all` endpoint serves entire puzzle bank. Client falls back to cached puzzles when offline. Manifest + meta tags enable install prompts.

**Tech Stack:** Service Worker API, Cache API, Web App Manifest, React Router (file-based routing), Cloudflare Workers, Drizzle ORM

---

### Task 1: Generate App Icons

We need PNG icons at multiple sizes for the manifest and iOS. The Logo component (`app/components/logo.tsx`) renders a 3x3 abstract grid SVG. We'll create a standalone SVG file and use it to generate PNGs.

**Files:**
- Create: `public/icon.svg`
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`
- Create: `public/apple-touch-icon.png`
- Create: `tools/generate-icons.ts`

**Step 1: Create the standalone SVG icon file**

Create `public/icon.svg` — a self-contained version of the Logo SVG with the primary color on the background color, including padding for a nice app icon look:

```svg
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="hsl(40, 30%, 97%)"/>
  <g transform="translate(96, 96) scale(9.14)">
    <rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="hsl(220, 25%, 50%)" fill-opacity="0.9"/>
    <rect x="12" y="1.5" width="9" height="9" rx="2" fill="none" stroke="hsl(220, 25%, 50%)" stroke-opacity="0.2" stroke-width="0.8"/>
    <rect x="22.5" y="1.5" width="9" height="9" rx="2" fill="hsl(220, 25%, 50%)" fill-opacity="0.4"/>
    <rect x="1.5" y="12" width="9" height="9" rx="2" fill="none" stroke="hsl(220, 25%, 50%)" stroke-opacity="0.2" stroke-width="0.8"/>
    <rect x="12" y="12" width="9" height="9" rx="2" fill="hsl(220, 25%, 50%)" fill-opacity="0.65"/>
    <rect x="22.5" y="12" width="9" height="9" rx="2" fill="none" stroke="hsl(220, 25%, 50%)" stroke-opacity="0.2" stroke-width="0.8"/>
    <rect x="1.5" y="22.5" width="9" height="9" rx="2" fill="hsl(220, 25%, 50%)" fill-opacity="0.5"/>
    <rect x="12" y="22.5" width="9" height="9" rx="2" fill="none" stroke="hsl(220, 25%, 50%)" stroke-opacity="0.2" stroke-width="0.8"/>
    <rect x="22.5" y="22.5" width="9" height="9" rx="2" fill="hsl(220, 25%, 50%)" fill-opacity="0.2"/>
  </g>
</svg>
```

**Step 2: Create icon generation script**

Create `tools/generate-icons.ts`:

```typescript
import sharp from "sharp";

async function main() {
  const sizes = [
    { name: "public/icon-192.png", size: 192 },
    { name: "public/icon-512.png", size: 512 },
    { name: "public/apple-touch-icon.png", size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp("public/icon.svg")
      .resize(size, size)
      .png()
      .toFile(name);
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

main().catch(console.error);
```

**Step 3: Install sharp as a dev dependency and generate icons**

Run:
```bash
cd /Users/samduke/Development/personal/supersudoku
npm install --save-dev sharp
npx tsx tools/generate-icons.ts
```

Expected: Three PNG files created in `public/`.

**Step 4: Verify icon files exist**

Run:
```bash
ls -la public/icon-192.png public/icon-512.png public/apple-touch-icon.png
```

Expected: All three files exist with non-zero sizes.

**Step 5: Commit**

```bash
git add public/icon.svg public/icon-192.png public/icon-512.png public/apple-touch-icon.png tools/generate-icons.ts package.json package-lock.json
git commit -m "feat: add PWA app icons generated from logo SVG"
```

---

### Task 2: Create Web App Manifest

**Files:**
- Create: `public/manifest.webmanifest`

**Step 1: Create the manifest file**

Create `public/manifest.webmanifest`:

```json
{
  "name": "Super Sudoku",
  "short_name": "Sudoku",
  "description": "A sudoku app that teaches you solving techniques",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#f7f4f0",
  "background_color": "#f7f4f0",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Note: `theme_color` and `background_color` are `hsl(40, 30%, 97%)` converted to hex `#f7f4f0`.

**Step 2: Commit**

```bash
git add public/manifest.webmanifest
git commit -m "feat: add web app manifest for PWA installability"
```

---

### Task 3: Add Meta Tags, Manifest Link, and SW Registration to Root Layout

**Files:**
- Modify: `app/root.tsx:43-63` (Layout component's `<head>`)

**Step 1: Add manifest link, meta tags, and SW registration**

In `app/root.tsx`, inside the `Layout` function's `<head>`, add these tags after `<Links />` and update the inline script to also register the service worker.

The full `<head>` should become:

```tsx
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <Meta />
  <Links />
  <link rel="manifest" href="/manifest.webmanifest" />
  <meta name="theme-color" content="#f7f4f0" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <script
    dangerouslySetInnerHTML={{
      __html: [
        'try{if(localStorage.getItem("super_sudoku_theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}',
        'if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")})}',
      ].join("\n"),
    }}
  />
</head>
```

**Step 2: Verify by running dev server**

Run: `npm run dev`

Open browser DevTools → Application → Manifest. Verify it loads correctly with the right name, icons, and display mode.

**Step 3: Commit**

```bash
git add app/root.tsx
git commit -m "feat: add PWA meta tags, manifest link, and service worker registration"
```

---

### Task 4: Create the `/api/puzzles/all` Endpoint

This endpoint returns every puzzle for offline caching. Routes in this project use React Router file-based routing: `app/routes/api.puzzles.all.ts` maps to `/api/puzzles/all`.

**Files:**
- Create: `app/routes/api.puzzles.all.ts`

**Step 1: Create the API route**

Create `app/routes/api.puzzles.all.ts`:

```typescript
import type { LoaderFunctionArgs } from "react-router";
import { getDb } from "~/db";
import { puzzles } from "~/db/schema";

export async function loader({ context }: LoaderFunctionArgs) {
  const { cloudflare } = context as { cloudflare: { env: Env } };
  const db = getDb(cloudflare.env.DB);

  const allPuzzles = await db
    .select({
      id: puzzles.id,
      puzzle: puzzles.puzzle,
      solution: puzzles.solution,
      difficultyScore: puzzles.difficultyScore,
      difficultyLabel: puzzles.difficultyLabel,
      techniquesRequired: puzzles.techniquesRequired,
    })
    .from(puzzles)
    .all();

  return Response.json(allPuzzles, {
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  });
}
```

**Step 2: Test the endpoint**

Run dev server and visit `http://localhost:5173/api/puzzles/all` in the browser. Verify:
- Returns JSON array
- Each object has: `id`, `puzzle`, `solution`, `difficultyScore`, `difficultyLabel`, `techniquesRequired`
- Array length should be ~1,100

**Step 3: Commit**

```bash
git add app/routes/api.puzzles.all.ts
git commit -m "feat: add /api/puzzles/all endpoint for offline puzzle caching"
```

---

### Task 5: Create the Service Worker

The service worker caches the app shell and puzzle data for offline use.

**Files:**
- Create: `public/sw.js`

**Step 1: Write the service worker**

Create `public/sw.js`:

```javascript
const CACHE_VERSION = "v1";
const STATIC_CACHE = "static-" + CACHE_VERSION;
const DATA_CACHE = "data-" + CACHE_VERSION;

var PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/apple-touch-icon.png",
];

// Install: precache essential resources + puzzle bank
self.addEventListener("install", function (event) {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(function (cache) {
        return cache.addAll(PRECACHE_URLS);
      }),
      caches.open(DATA_CACHE).then(function (cache) {
        return cache.add("/api/puzzles/all");
      }),
    ]).then(function () {
      return self.skipWaiting();
    })
  );
});

// Activate: clean up old caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== STATIC_CACHE && key !== DATA_CACHE;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Fetch strategy
self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip auth, game-save, settings, and sync API calls (network-only)
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname === "/api/game/save" ||
    url.pathname === "/api/settings" ||
    url.pathname === "/api/sync/migrate"
  ) {
    return;
  }

  // Puzzle bank: stale-while-revalidate
  if (url.pathname === "/api/puzzles/all") {
    event.respondWith(
      caches.open(DATA_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          var fetchPromise = fetch(request)
            .then(function (response) {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(function () {
              return cached;
            });
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Random puzzle API: network-first, offline error triggers client-side fallback
  if (url.pathname === "/api/puzzle/random") {
    event.respondWith(
      fetch(request).catch(function () {
        return new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webmanifest") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          if (cached) return cached;
          return fetch(request).then(function (response) {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // HTML pages (navigation): network-first, cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var clone = response.clone();
          caches.open(STATIC_CACHE).then(function (cache) {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (cached) {
            return cached || caches.match("/");
          });
        })
    );
    return;
  }

  // Everything else: network-first
  event.respondWith(
    fetch(request).catch(function () {
      return caches.match(request);
    })
  );
});
```

**Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: add service worker for offline caching"
```

---

### Task 6: Add Offline Fallback for Random Puzzle Selection

When the user is offline and clicks "New Puzzle", the `/api/puzzle/random` call will fail. We need client-side fallback logic that picks a random puzzle from the cached puzzle bank.

**Files:**
- Modify: `app/routes/home.tsx:81-114` (add helper function and update handleNewPuzzle)

**Step 1: Add the offline puzzle selection helper**

Add this interface and function after the `formatTime` function (line 85) and before the `Home` component (line 87) in `app/routes/home.tsx`:

```typescript
interface CachedPuzzle {
  id: string;
  difficultyScore: number;
}

async function getOfflineRandomPuzzle(min: number, max: number): Promise<string | null> {
  try {
    const cache = await caches.open("data-v1");
    const response = await cache.match("/api/puzzles/all");
    if (!response) return null;
    const allPuzzles: CachedPuzzle[] = await response.json();
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
```

**Step 2: Update `handleNewPuzzle` to use the fallback**

Replace the existing `handleNewPuzzle` function (lines 94-114) with:

```typescript
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
```

**Step 3: Commit**

```bash
git add app/routes/home.tsx
git commit -m "feat: add offline fallback for random puzzle selection"
```

---

### Task 7: Add Offline Fallback for Play Page

When offline, the play page loader can't fetch puzzle data from D1. We need the play page's `ErrorBoundary` to fall back to cached puzzle data.

**Files:**
- Modify: `app/routes/play.$puzzleId.tsx` (add/update ErrorBoundary export)

**Step 1: Read the full play page file**

Read `app/routes/play.$puzzleId.tsx` completely to understand the component structure, the `useGame` hook interface, and whether an ErrorBoundary already exists.

**Step 2: Add offline ErrorBoundary**

Add or update the `ErrorBoundary` export. The boundary should:
1. Use `useParams()` to get `puzzleId`
2. Use `useEffect` + `useState` to fetch the puzzle from the service worker cache (`caches.open("data-v1")` → match `/api/puzzles/all` → find puzzle by ID)
3. If found, render the game UI with the cached puzzle data and localStorage-only progress
4. If not found, show a friendly "Puzzle Unavailable" message with a link back to home

The key imports needed: `useParams`, `useState`, `useEffect`, `Link` from `react-router`.

The cached puzzle object shape matches the loader's return (has `id`, `puzzle`, `solution`, `difficultyScore`, `difficultyLabel`, `techniquesRequired`), so it can be passed to the same game components.

**Important:** Read the full play page to understand how `useGame` is initialized and what props `Board` and `NumberPad` expect. The offline version should initialize `useGame` with `progress: null` (fresh game) since server-side progress isn't available offline. localStorage progress will still work if the user previously played this puzzle.

**Step 3: Test offline play**

1. Start dev server, visit a puzzle page to cache assets
2. Go offline (DevTools → Network → Offline)
3. Go to home page → select difficulty → click New Puzzle
4. Puzzle should load from cache and be playable

**Step 4: Commit**

```bash
git add app/routes/play.$puzzleId.tsx
git commit -m "feat: add offline fallback for play page via cached puzzle data"
```

---

### Task 8: Final Testing & Verification

**Step 1: Run typecheck**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

**Step 2: Run Lighthouse PWA audit**

1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. Open Chrome DevTools → Lighthouse → check "Progressive Web App"
4. Run audit

Expected: PWA installability criteria met (manifest + service worker + HTTPS).

**Step 3: Test offline flow end-to-end**

1. Open the app in Chrome, let service worker install and cache
2. DevTools → Application → Service Workers → verify "Activated and running"
3. DevTools → Application → Cache Storage → verify `static-v1` and `data-v1` caches exist
4. DevTools → Network → check "Offline"
5. Refresh the page → should load from cache
6. Click "New Puzzle" → should work from cached puzzle bank
7. Play the puzzle → should work fully

**Step 4: Deploy and test on mobile**

Run: `npm run deploy`

- iPhone: Safari → sudoku.samduke.dev → Share → Add to Home Screen
- Android: Chrome → sudoku.samduke.dev → install banner or menu → Install

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address PWA testing findings"
```
