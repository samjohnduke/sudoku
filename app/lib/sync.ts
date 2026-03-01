const SETTINGS_KEY = "super_sudoku_settings";
const LOCAL_SAVE_PREFIX = "super_sudoku_progress_";

interface LocalSaveEntry {
  puzzleId: string;
  boardState: string;
  notesSnapshot: string;
  timeSeconds: number;
  completed: boolean;
  savedAt?: string;
}

/**
 * Migrate localStorage data to the server after a successful sign-in.
 * Silently fails so it never blocks the auth flow.
 */
export async function migrateLocalDataToServer() {
  const settings = localStorage.getItem(SETTINGS_KEY);

  // Gather all saved game progress entries
  const progressEntries: Array<{
    puzzleId: string;
    boardState: string;
    notesSnapshot: string;
    timeSeconds: number;
  }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LOCAL_SAVE_PREFIX)) {
      try {
        const data = JSON.parse(localStorage.getItem(key)!);
        if (data.puzzleId && data.boardState) {
          progressEntries.push({
            puzzleId: data.puzzleId,
            boardState: data.boardState,
            notesSnapshot: data.notesSnapshot ?? "",
            timeSeconds: data.timeSeconds ?? 0,
          });
        }
      } catch {
        // Malformed entry, skip
      }
    }
  }

  if (progressEntries.length === 0 && !settings) return;

  // Migrate each game progress entry individually
  for (const entry of progressEntries) {
    try {
      const payload: Record<string, unknown> = { currentGame: entry };
      const res = await fetch("/api/sync/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        localStorage.removeItem(LOCAL_SAVE_PREFIX + entry.puzzleId);
      }
    } catch {
      // Network error — data stays in localStorage for next attempt
    }
  }

  // Migrate settings
  if (settings) {
    try {
      const res = await fetch("/api/sync/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        localStorage.removeItem(SETTINGS_KEY);
      }
    } catch {
      // Network error — data stays in localStorage for next attempt
    }
  }
}

/**
 * Sync any offline-saved game progress back to the server.
 * Uses the save API with `savedAt` so the server can reject stale writes
 * (e.g. another device saved newer progress while this one was offline).
 *
 * Called when the browser fires the `online` event.
 * Safe to call multiple times — entries are only removed on successful sync.
 */
export async function syncOfflineSaves() {
  const entries: Array<{ key: string; data: LocalSaveEntry }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(LOCAL_SAVE_PREFIX)) continue;
    try {
      const data = JSON.parse(localStorage.getItem(key)!) as LocalSaveEntry;
      if (data.puzzleId && data.boardState) {
        entries.push({ key, data });
      }
    } catch {
      // Malformed — skip
    }
  }

  if (entries.length === 0) return;

  for (const { key, data } of entries) {
    try {
      const res = await fetch("/api/game/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: data.puzzleId,
          boardState: data.boardState,
          notesSnapshot: data.notesSnapshot ?? "",
          timeSeconds: data.timeSeconds ?? 0,
          completed: data.completed ?? false,
          savedAt: data.savedAt,
        }),
      });
      if (res.ok) {
        localStorage.removeItem(key);
      }
    } catch {
      // Still offline or transient error — keep for next attempt
      break;
    }
  }
}
