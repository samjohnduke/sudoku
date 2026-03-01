import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mergeProgress, getLocalProgress } from "../play.$puzzleId";

const LOCAL_SAVE_PREFIX = "super_sudoku_progress_";

// ---------------------------------------------------------------------------
// mergeProgress — pure function tests
// ---------------------------------------------------------------------------

describe("mergeProgress", () => {
  const serverProgress = {
    boardState: "server-board",
    notes: "server-notes",
    timeSeconds: 200,
    updatedAt: "2025-06-01T10:00:00.000Z",
  };

  const localProgress = {
    boardState: "local-board",
    notes: "local-notes",
    timeSeconds: 300,
    savedAt: "2025-06-01T12:00:00.000Z",
  };

  it("returns server progress when no local progress exists", () => {
    const result = mergeProgress(serverProgress, null);
    expect(result).toBe(serverProgress);
  });

  it("returns null when neither exists", () => {
    const result = mergeProgress(null, null);
    expect(result).toBeNull();
  });

  it("returns local progress when server has no progress", () => {
    const result = mergeProgress(null, localProgress);
    expect(result).toEqual({
      boardState: "local-board",
      notes: "local-notes",
      timeSeconds: 300,
      updatedAt: "2025-06-01T12:00:00.000Z",
    });
  });

  it("picks local when local savedAt is newer than server updatedAt", () => {
    const result = mergeProgress(serverProgress, localProgress);
    expect(result!.boardState).toBe("local-board");
    expect(result!.timeSeconds).toBe(300);
  });

  it("picks server when server updatedAt is newer than local savedAt", () => {
    const olderLocal = { ...localProgress, savedAt: "2025-06-01T08:00:00.000Z" };
    const result = mergeProgress(serverProgress, olderLocal);
    expect(result!.boardState).toBe("server-board");
    expect(result!.timeSeconds).toBe(200);
  });

  it("picks server when timestamps are equal", () => {
    const sameTimeLocal = { ...localProgress, savedAt: "2025-06-01T10:00:00.000Z" };
    const result = mergeProgress(serverProgress, sameTimeLocal);
    expect(result!.boardState).toBe("server-board");
  });

  it("picks local when server has no updatedAt (legacy row)", () => {
    const legacyServer = { ...serverProgress, updatedAt: null };
    const result = mergeProgress(legacyServer, localProgress);
    expect(result!.boardState).toBe("local-board");
  });

  it("picks server when local has no savedAt", () => {
    const noTimestampLocal = { ...localProgress, savedAt: null };
    const result = mergeProgress(serverProgress, noTimestampLocal);
    // local has no savedAt → the `local?.savedAt && serverProgress` branch is false
    // falls through to return serverProgress
    expect(result!.boardState).toBe("server-board");
  });

  it("returns local (no savedAt) when server has no progress", () => {
    const noTimestampLocal = { ...localProgress, savedAt: null };
    const result = mergeProgress(null, noTimestampLocal);
    expect(result!.boardState).toBe("local-board");
    expect(result!.updatedAt).toBeNull();
  });

  // ── Multi-device scenario tests ──

  it("scenario: played offline on phone, desktop has newer saves", () => {
    // Phone went offline, saved at 09:00
    // Desktop saved at 11:00
    // Phone reconnects, opens puzzle page
    const phone = { ...localProgress, savedAt: "2025-06-01T09:00:00.000Z" };
    const desktop = { ...serverProgress, updatedAt: "2025-06-01T11:00:00.000Z" };
    const result = mergeProgress(desktop, phone);
    expect(result!.boardState).toBe("server-board"); // desktop wins
  });

  it("scenario: played offline on phone, desktop has stale saves", () => {
    // Desktop last saved at 08:00
    // Phone played offline, saved at 10:00
    // Phone reconnects, opens puzzle page
    const phone = { ...localProgress, savedAt: "2025-06-01T10:00:00.000Z" };
    const desktop = { ...serverProgress, updatedAt: "2025-06-01T08:00:00.000Z" };
    const result = mergeProgress(desktop, phone);
    expect(result!.boardState).toBe("local-board"); // phone wins
  });
});

// ---------------------------------------------------------------------------
// getLocalProgress — localStorage integration
// ---------------------------------------------------------------------------

describe("getLocalProgress", () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when no entry exists", () => {
    expect(getLocalProgress("nonexistent")).toBeNull();
  });

  it("returns parsed progress with savedAt", () => {
    storage[LOCAL_SAVE_PREFIX + "p1"] = JSON.stringify({
      puzzleId: "p1",
      boardState: "board",
      notesSnapshot: "notes",
      timeSeconds: 100,
      completed: false,
      savedAt: "2025-06-01T10:00:00.000Z",
    });

    const result = getLocalProgress("p1");
    expect(result).toEqual({
      boardState: "board",
      notes: "notes",
      timeSeconds: 100,
      savedAt: "2025-06-01T10:00:00.000Z",
    });
  });

  it("returns savedAt as null when not present in entry", () => {
    storage[LOCAL_SAVE_PREFIX + "p1"] = JSON.stringify({
      puzzleId: "p1",
      boardState: "board",
      notesSnapshot: "notes",
      timeSeconds: 100,
      completed: false,
    });

    const result = getLocalProgress("p1");
    expect(result!.savedAt).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    storage[LOCAL_SAVE_PREFIX + "p1"] = "not json";
    expect(getLocalProgress("p1")).toBeNull();
  });
});
