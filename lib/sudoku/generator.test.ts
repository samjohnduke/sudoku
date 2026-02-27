import { describe, it, expect } from "vitest";
import { generatePuzzle, generateSolvedGrid, hasUniqueSolution } from "./generator";
import { parseGrid } from "./utils";

describe("generateSolvedGrid", () => {
  it("should produce a valid complete grid", () => {
    const grid = generateSolvedGrid();
    // All cells filled
    expect(grid.flat().every(v => v >= 1 && v <= 9)).toBe(true);
    // Each row, col, box has 1-9
    for (let i = 0; i < 9; i++) {
      expect(new Set(grid[i]).size).toBe(9);
      expect(new Set(grid.map(r => r[i])).size).toBe(9);
    }
  });

  it("should produce different grids on separate calls", () => {
    const g1 = generateSolvedGrid();
    const g2 = generateSolvedGrid();
    // Extremely unlikely to be the same
    expect(g1.flat().join("")).not.toBe(g2.flat().join(""));
  });
});

describe("hasUniqueSolution", () => {
  it("should return true for a valid puzzle", () => {
    const grid = parseGrid("530070000600195000098000060800060003400803001700020006060000280000419005000080079");
    expect(hasUniqueSolution(grid)).toBe(true);
  });

  it("should return false for an empty grid", () => {
    const grid = parseGrid("0".repeat(81));
    expect(hasUniqueSolution(grid)).toBe(false);
  });
});

describe("generatePuzzle", () => {
  it("should generate a puzzle with exactly one solution", () => {
    const { puzzle, solution } = generatePuzzle();
    expect(puzzle.flat().filter(v => v === 0).length).toBeGreaterThan(0);
    expect(solution.flat().filter(v => v === 0).length).toBe(0);
    expect(hasUniqueSolution(puzzle)).toBe(true);
  }, 30000);

  it("should have solution that matches all filled cells", () => {
    const { puzzle, solution } = generatePuzzle();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== 0) {
          expect(puzzle[r][c]).toBe(solution[r][c]);
        }
      }
    }
  }, 30000);
});
