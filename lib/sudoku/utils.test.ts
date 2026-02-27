import { describe, it, expect } from "vitest";
import { parseGrid, gridToString, cloneGrid } from "./utils";

describe("parseGrid", () => {
  it("should parse a standard 81-char string into a 9x9 grid", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const grid = parseGrid(puzzle);
    expect(grid.length).toBe(9);
    expect(grid[0].length).toBe(9);
    expect(grid[0][0]).toBe(5);
    expect(grid[0][1]).toBe(3);
    expect(grid[0][2]).toBe(0);
  });

  it("should treat '.' as 0", () => {
    const puzzle =
      "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79";
    const grid = parseGrid(puzzle);
    expect(grid[0][2]).toBe(0);
    expect(grid[0][3]).toBe(0);
  });
});

describe("gridToString", () => {
  it("should convert a grid back to a string with dots for zeros", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const grid = parseGrid(puzzle);
    const str = gridToString(grid);
    expect(str).toBe(
      "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
    );
  });

  it("should round-trip a completed puzzle", () => {
    const solved =
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
    const grid = parseGrid(solved);
    const str = gridToString(grid);
    expect(str).toBe(solved);
  });
});

describe("cloneGrid", () => {
  it("should create a deep copy", () => {
    const puzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const grid = parseGrid(puzzle);
    const clone = cloneGrid(grid);
    expect(clone).toEqual(grid);
    clone[0][0] = 9;
    expect(grid[0][0]).toBe(5);
  });
});
