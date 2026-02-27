import { describe, it, expect } from "vitest";
import { difficultyLabel, gradePuzzle } from "./grader";
import { parseGrid } from "./utils";

const EASY_PUZZLE =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

describe("difficultyLabel", () => {
  it("returns Beginner for score 0", () => {
    expect(difficultyLabel(0)).toBe("Beginner");
  });

  it("returns Beginner for score 15", () => {
    expect(difficultyLabel(15)).toBe("Beginner");
  });

  it("returns Easy for score 16", () => {
    expect(difficultyLabel(16)).toBe("Easy");
  });

  it("returns Easy for score 35", () => {
    expect(difficultyLabel(35)).toBe("Easy");
  });

  it("returns Medium for score 36", () => {
    expect(difficultyLabel(36)).toBe("Medium");
  });

  it("returns Medium for score 55", () => {
    expect(difficultyLabel(55)).toBe("Medium");
  });

  it("returns Hard for score 56", () => {
    expect(difficultyLabel(56)).toBe("Hard");
  });

  it("returns Hard for score 75", () => {
    expect(difficultyLabel(75)).toBe("Hard");
  });

  it("returns Expert for score 76", () => {
    expect(difficultyLabel(76)).toBe("Expert");
  });

  it("returns Expert for score 100", () => {
    expect(difficultyLabel(100)).toBe("Expert");
  });
});

describe("gradePuzzle", () => {
  it("grades the easy puzzle with a low score and simple label", () => {
    const grid = parseGrid(EASY_PUZZLE);
    const result = gradePuzzle(grid);
    expect(result.solved).toBe(true);
    // Only uses naked/hidden singles, so score should be modest
    expect(result.score).toBeLessThanOrEqual(55);
    expect(["Beginner", "Easy", "Medium"]).toContain(result.label);
  });

  it("returns score between 0 and 100", () => {
    const grid = parseGrid(EASY_PUZZLE);
    const result = gradePuzzle(grid);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns correct techniquesUsed array for easy puzzle", () => {
    const grid = parseGrid(EASY_PUZZLE);
    const result = gradePuzzle(grid);
    expect(result.techniquesUsed.length).toBeGreaterThan(0);
    // Easy puzzle should only need naked singles and hidden singles
    for (const t of result.techniquesUsed) {
      expect(["naked-single", "hidden-single"]).toContain(t);
    }
  });

  it("returns steps array with entries", () => {
    const grid = parseGrid(EASY_PUZZLE);
    const result = gradePuzzle(grid);
    expect(result.steps.length).toBeGreaterThan(0);
    for (const step of result.steps) {
      expect(step.technique).toBeDefined();
      expect(step.description).toBeDefined();
    }
  });

  it("returns solved: false for a puzzle unsolvable by techniques", () => {
    // A nearly empty grid that can't be solved by logic alone
    const emptyPuzzle =
      "100000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const grid = parseGrid(emptyPuzzle);
    const result = gradePuzzle(grid);
    expect(result.solved).toBe(false);
  });

  it("difficulty score increases as puzzles get harder", () => {
    // Easy: only naked/hidden singles needed
    const easyPuzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const easyResult = gradePuzzle(parseGrid(easyPuzzle));

    // Hard: requires advanced techniques beyond naked/hidden singles
    const hardPuzzle =
      "000801000000000043500000000000070800000000100020030000600000075003400000000200600";
    const hardResult = gradePuzzle(parseGrid(hardPuzzle));

    // Hard puzzle should score strictly higher than easy
    expect(hardResult.score).toBeGreaterThan(easyResult.score);
  });

  it("puzzle requiring only naked singles should score lower than one requiring X-Wing level techniques", () => {
    // Simple puzzle: naked/hidden singles only
    const simplePuzzle =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const simpleResult = gradePuzzle(parseGrid(simplePuzzle));

    // Hard puzzle that requires advanced techniques (pointing pairs, naked pairs, etc.)
    const hardPuzzle =
      "000801000000000043500000000000070800000000100020030000600000075003400000000200600";
    const hardResult = gradePuzzle(parseGrid(hardPuzzle));

    // Hard puzzle should score higher than the simple one
    expect(hardResult.score).toBeGreaterThan(simpleResult.score);
  });
});
