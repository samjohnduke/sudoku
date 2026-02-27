import { describe, it, expect } from "vitest";
import { getHint } from "../hints";
import { parseGrid } from "../../../lib/sudoku/utils";

describe("getHint", () => {
  it("should return a hint for an unsolved puzzle", () => {
    const grid = parseGrid(
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    );
    const hint = getHint(grid.flat());
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBeDefined();
    expect(hint!.description).toBeTruthy();
    expect(hint!.placements.length + hint!.eliminations.length).toBeGreaterThan(
      0,
    );
  });

  it("should return null for a completed puzzle", () => {
    const grid = parseGrid(
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    );
    const hint = getHint(grid.flat());
    expect(hint).toBeNull();
  });
});
