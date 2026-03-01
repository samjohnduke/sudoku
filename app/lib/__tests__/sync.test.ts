import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { syncOfflineSaves } from "../sync";

const LOCAL_SAVE_PREFIX = "super_sudoku_progress_";

function makeLocalSave(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    puzzleId: "puzzle-1",
    boardState: "123456789".repeat(9),
    notesSnapshot: "{}",
    timeSeconds: 120,
    completed: false,
    savedAt: "2025-06-01T10:00:00.000Z",
    ...overrides,
  });
}

describe("syncOfflineSaves", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      key: (index: number) => Object.keys(storage)[index] ?? null,
      get length() { return Object.keys(storage).length; },
    });

    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when localStorage has no progress entries", async () => {
    storage["some_other_key"] = "value";

    await syncOfflineSaves();

    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends each entry to /api/game/save with savedAt", async () => {
    storage[LOCAL_SAVE_PREFIX + "puzzle-1"] = makeLocalSave({
      puzzleId: "puzzle-1",
      savedAt: "2025-06-01T10:00:00.000Z",
    });
    storage[LOCAL_SAVE_PREFIX + "puzzle-2"] = makeLocalSave({
      puzzleId: "puzzle-2",
      savedAt: "2025-06-01T11:00:00.000Z",
    });

    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await syncOfflineSaves();

    expect(fetch).toHaveBeenCalledTimes(2);

    const firstCall = vi.mocked(fetch).mock.calls[0];
    expect(firstCall[0]).toBe("/api/game/save");
    const firstBody = JSON.parse((firstCall[1] as RequestInit).body as string);
    expect(firstBody.savedAt).toBeDefined();
    expect(firstBody.puzzleId).toBeTruthy();
  });

  it("removes localStorage entry on successful sync", async () => {
    storage[LOCAL_SAVE_PREFIX + "puzzle-1"] = makeLocalSave({ puzzleId: "puzzle-1" });

    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await syncOfflineSaves();

    expect(storage[LOCAL_SAVE_PREFIX + "puzzle-1"]).toBeUndefined();
  });

  it("keeps localStorage entry when fetch fails (still offline)", async () => {
    storage[LOCAL_SAVE_PREFIX + "puzzle-1"] = makeLocalSave({ puzzleId: "puzzle-1" });

    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await syncOfflineSaves();

    expect(storage[LOCAL_SAVE_PREFIX + "puzzle-1"]).toBeDefined();
  });

  it("stops syncing after a network error (doesn't try remaining entries)", async () => {
    storage[LOCAL_SAVE_PREFIX + "puzzle-1"] = makeLocalSave({ puzzleId: "puzzle-1" });
    storage[LOCAL_SAVE_PREFIX + "puzzle-2"] = makeLocalSave({ puzzleId: "puzzle-2" });

    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await syncOfflineSaves();

    // Should have only attempted the first entry then stopped
    expect(fetch).toHaveBeenCalledTimes(1);
    // Both entries still in storage
    expect(Object.keys(storage).length).toBe(2);
  });

  it("keeps localStorage entry when server returns non-ok status", async () => {
    storage[LOCAL_SAVE_PREFIX + "puzzle-1"] = makeLocalSave({ puzzleId: "puzzle-1" });

    vi.mocked(fetch).mockResolvedValue(new Response("Unauthorized", { status: 401 }));

    await syncOfflineSaves();

    expect(storage[LOCAL_SAVE_PREFIX + "puzzle-1"]).toBeDefined();
  });

  it("skips malformed localStorage entries without crashing", async () => {
    storage[LOCAL_SAVE_PREFIX + "bad"] = "not valid json{{{";
    storage[LOCAL_SAVE_PREFIX + "puzzle-1"] = makeLocalSave({ puzzleId: "puzzle-1" });

    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await syncOfflineSaves();

    // Only the valid entry should have been sent
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(storage[LOCAL_SAVE_PREFIX + "puzzle-1"]).toBeUndefined();
    // Malformed entry is left alone
    expect(storage[LOCAL_SAVE_PREFIX + "bad"]).toBeDefined();
  });

  it("sends defaults for missing optional fields", async () => {
    // Entry without notesSnapshot, timeSeconds, completed, savedAt
    storage[LOCAL_SAVE_PREFIX + "puzzle-1"] = JSON.stringify({
      puzzleId: "puzzle-1",
      boardState: "1".repeat(81),
    });

    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await syncOfflineSaves();

    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.notesSnapshot).toBe("");
    expect(body.timeSeconds).toBe(0);
    expect(body.completed).toBe(false);
    expect(body.savedAt).toBeUndefined();
  });
});
