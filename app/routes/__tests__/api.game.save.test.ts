import { describe, it, expect } from "vitest";
import { validateSaveBody, shouldSkipSave, type SaveGameBody } from "../api.game.save";

// ---------------------------------------------------------------------------
// validateSaveBody
// ---------------------------------------------------------------------------

describe("validateSaveBody", () => {
  const valid: SaveGameBody = {
    puzzleId: "abc-123",
    boardState: "1".repeat(81),
    notesSnapshot: "{}",
    timeSeconds: 120,
    completed: false,
  };

  it("accepts a valid body", () => {
    expect(validateSaveBody(valid)).toBe(true);
  });

  it("accepts a valid body with savedAt", () => {
    expect(validateSaveBody({ ...valid, savedAt: "2025-01-01T00:00:00Z" })).toBe(true);
  });

  it("rejects null", () => {
    expect(validateSaveBody(null)).toBe(false);
  });

  it("rejects non-object", () => {
    expect(validateSaveBody("string")).toBe(false);
    expect(validateSaveBody(42)).toBe(false);
  });

  it("rejects empty puzzleId", () => {
    expect(validateSaveBody({ ...valid, puzzleId: "" })).toBe(false);
  });

  it("rejects non-string puzzleId", () => {
    expect(validateSaveBody({ ...valid, puzzleId: 123 })).toBe(false);
  });

  it("rejects non-string boardState", () => {
    expect(validateSaveBody({ ...valid, boardState: 123 })).toBe(false);
  });

  it("rejects non-number timeSeconds", () => {
    expect(validateSaveBody({ ...valid, timeSeconds: "120" })).toBe(false);
  });

  it("rejects negative timeSeconds", () => {
    expect(validateSaveBody({ ...valid, timeSeconds: -1 })).toBe(false);
  });

  it("rejects NaN timeSeconds", () => {
    expect(validateSaveBody({ ...valid, timeSeconds: NaN })).toBe(false);
  });

  it("rejects Infinity timeSeconds", () => {
    expect(validateSaveBody({ ...valid, timeSeconds: Infinity })).toBe(false);
  });

  it("rejects non-boolean completed", () => {
    expect(validateSaveBody({ ...valid, completed: "true" })).toBe(false);
  });

  it("rejects non-string savedAt", () => {
    expect(validateSaveBody({ ...valid, savedAt: 12345 })).toBe(false);
  });

  it("accepts missing savedAt (it's optional)", () => {
    const { ...body } = valid;
    expect(validateSaveBody(body)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// shouldSkipSave — conflict resolution
// ---------------------------------------------------------------------------

describe("shouldSkipSave", () => {
  const baseSave: SaveGameBody = {
    puzzleId: "p1",
    boardState: "1".repeat(81),
    notesSnapshot: "{}",
    timeSeconds: 120,
    completed: false,
  };

  it("does not skip when there is no savedAt (live save, not offline sync)", () => {
    const result = shouldSkipSave(baseSave, {
      completedAt: null,
      updatedAt: "2025-06-01T12:00:00.000Z",
    });
    expect(result).toBe(false);
  });

  it("does not skip when server has no updatedAt (legacy row)", () => {
    const result = shouldSkipSave(
      { ...baseSave, savedAt: "2025-06-01T10:00:00.000Z" },
      { completedAt: null, updatedAt: null },
    );
    expect(result).toBe(false);
  });

  it("does not skip when local savedAt is newer than server updatedAt", () => {
    const result = shouldSkipSave(
      { ...baseSave, savedAt: "2025-06-01T12:00:00.000Z" },
      { completedAt: null, updatedAt: "2025-06-01T10:00:00.000Z" },
    );
    expect(result).toBe(false);
  });

  it("skips when server updatedAt is newer than local savedAt", () => {
    const result = shouldSkipSave(
      { ...baseSave, savedAt: "2025-06-01T10:00:00.000Z" },
      { completedAt: null, updatedAt: "2025-06-01T12:00:00.000Z" },
    );
    expect(result).toBe(true);
  });

  it("skips when timestamps are exactly equal", () => {
    const ts = "2025-06-01T10:00:00.000Z";
    const result = shouldSkipSave(
      { ...baseSave, savedAt: ts },
      { completedAt: null, updatedAt: ts },
    );
    expect(result).toBe(true);
  });

  it("skips when trying to overwrite a completed puzzle with in-progress data", () => {
    const result = shouldSkipSave(
      { ...baseSave, completed: false, savedAt: "2025-06-01T12:00:00.000Z" },
      { completedAt: "2025-06-01T10:00:00.000Z", updatedAt: "2025-06-01T09:00:00.000Z" },
    );
    expect(result).toBe(true);
  });

  it("does not skip when syncing a completion over an in-progress server record", () => {
    const result = shouldSkipSave(
      { ...baseSave, completed: true, savedAt: "2025-06-01T12:00:00.000Z" },
      { completedAt: null, updatedAt: "2025-06-01T10:00:00.000Z" },
    );
    expect(result).toBe(false);
  });

  it("does not skip when syncing a completion over an older completion", () => {
    // Edge case: both completed, local is newer → allow (server re-records completion)
    const result = shouldSkipSave(
      { ...baseSave, completed: true, savedAt: "2025-06-01T12:00:00.000Z" },
      { completedAt: "2025-06-01T08:00:00.000Z", updatedAt: "2025-06-01T08:00:00.000Z" },
    );
    expect(result).toBe(false);
  });

  // ── Multi-device scenarios ──

  it("device A offline stale data does not overwrite device B newer data", () => {
    // Device A went offline at 09:00, saved at 09:05
    // Device B saved at 10:30
    // Device A reconnects and tries to sync
    const result = shouldSkipSave(
      { ...baseSave, savedAt: "2025-06-01T09:05:00.000Z" },
      { completedAt: null, updatedAt: "2025-06-01T10:30:00.000Z" },
    );
    expect(result).toBe(true);
  });

  it("device A offline newer data overwrites device B older data", () => {
    // Device A went offline, saved at 11:00 (played for a while offline)
    // Device B last saved at 09:00
    // Device A reconnects — its progress is newer
    const result = shouldSkipSave(
      { ...baseSave, savedAt: "2025-06-01T11:00:00.000Z" },
      { completedAt: null, updatedAt: "2025-06-01T09:00:00.000Z" },
    );
    expect(result).toBe(false);
  });

  it("device A cannot un-complete a puzzle that device B finished", () => {
    // Device B completed puzzle at 10:00
    // Device A was offline with in-progress data from 09:30
    // Device A reconnects and tries to sync in-progress state
    const result = shouldSkipSave(
      { ...baseSave, completed: false, savedAt: "2025-06-01T09:30:00.000Z" },
      { completedAt: "2025-06-01T10:00:00.000Z", updatedAt: "2025-06-01T10:00:00.000Z" },
    );
    expect(result).toBe(true);
  });

  it("device A cannot un-complete even with a newer timestamp", () => {
    // This is the critical safety check: even if device A's savedAt is
    // technically newer, we never un-complete a puzzle
    const result = shouldSkipSave(
      { ...baseSave, completed: false, savedAt: "2025-06-01T12:00:00.000Z" },
      { completedAt: "2025-06-01T10:00:00.000Z", updatedAt: "2025-06-01T10:00:00.000Z" },
    );
    expect(result).toBe(true);
  });
});
