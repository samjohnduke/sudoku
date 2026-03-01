import { describe, it, expect } from "vitest";
import { getHint } from "../hints";
import { parseGrid } from "../../../lib/sudoku/utils";

const PUZZLE =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
const SOLUTION =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

function setup() {
  return {
    initial: parseGrid(PUZZLE).flat(),
    solution: parseGrid(SOLUTION).flat(),
  };
}

/** All empty cell indices in the initial puzzle */
function emptyCells(initial: number[]): number[] {
  return initial.reduce<number[]>((acc, v, i) => {
    if (v === 0) acc.push(i);
    return acc;
  }, []);
}

describe("getHint", () => {
  it("should return a hint for an unsolved puzzle", () => {
    const { initial, solution } = setup();
    const hint = getHint(initial, [...initial], solution);
    expect(hint).not.toBeNull();
    expect(hint!.technique).toBeDefined();
    expect(hint!.description).toBeTruthy();
    expect(hint!.placements.length + hint!.eliminations.length).toBeGreaterThan(
      0,
    );
  });

  it("should return null for a completed puzzle", () => {
    const { initial, solution } = setup();
    const hint = getHint(initial, solution, solution);
    expect(hint).toBeNull();
  });

  it("should ignore a single incorrect user entry", () => {
    const { initial, solution } = setup();
    const current = [...initial];
    const emptyIdx = current.findIndex((v) => v === 0);
    current[emptyIdx] = solution[emptyIdx] === 1 ? 2 : 1;

    const hint = getHint(initial, current, solution);
    expect(hint).not.toBeNull();
    if (hint!.placements.length > 0) {
      const placement = hint!.placements[0];
      const [r, c] = placement.cell;
      expect(placement.value).toBe(solution[r * 9 + c]);
    }
  });

  it("should produce the same hint whether wrong entries exist or not", () => {
    const { initial, solution } = setup();

    // Hint with a clean board (no user entries)
    const baseline = getHint(initial, [...initial], solution);

    // Now add several wrong entries
    const current = [...initial];
    const empties = emptyCells(initial);
    for (const idx of empties.slice(0, 5)) {
      current[idx] = solution[idx] === 9 ? 1 : solution[idx] + 1;
    }
    const withErrors = getHint(initial, current, solution);

    expect(baseline).not.toBeNull();
    expect(withErrors).not.toBeNull();
    expect(withErrors!.technique).toBe(baseline!.technique);
    expect(withErrors!.cells).toEqual(baseline!.cells);
    expect(withErrors!.placements).toEqual(baseline!.placements);
  });

  it("should never suggest a value that contradicts the solution", () => {
    const { initial, solution } = setup();

    // Scatter wrong values across many empty cells
    const current = [...initial];
    const empties = emptyCells(initial);
    for (let i = 0; i < empties.length; i++) {
      if (i % 3 === 0) {
        const idx = empties[i];
        current[idx] = solution[idx] === 9 ? 1 : solution[idx] + 1;
      }
    }

    const hint = getHint(initial, current, solution);
    if (hint && hint.placements.length > 0) {
      for (const placement of hint.placements) {
        const [r, c] = placement.cell;
        expect(placement.value).toBe(solution[r * 9 + c]);
      }
    }
  });

  it("should respect correct user entries and advance past them", () => {
    const { initial, solution } = setup();

    // Fill in some correct values
    const current = [...initial];
    const empties = emptyCells(initial);
    for (const idx of empties.slice(0, 10)) {
      current[idx] = solution[idx];
    }

    const hintFromStart = getHint(initial, [...initial], solution);
    const hintWithProgress = getHint(initial, current, solution);

    expect(hintFromStart).not.toBeNull();
    expect(hintWithProgress).not.toBeNull();

    // With correct progress, the hint should target a cell that's still empty
    // in the progressed board (not one already correctly filled)
    if (hintWithProgress!.placements.length > 0) {
      for (const placement of hintWithProgress!.placements) {
        const [r, c] = placement.cell;
        const idx = r * 9 + c;
        expect(current[idx]).toBe(0);
        expect(placement.value).toBe(solution[idx]);
      }
    }
  });

  it("should treat wrong entries as empty, not as filled cells", () => {
    const { initial, solution } = setup();

    // Fill ALL empty cells with wrong values
    const current = [...initial];
    const empties = emptyCells(initial);
    for (const idx of empties) {
      current[idx] = solution[idx] === 9 ? 1 : solution[idx] + 1;
    }

    // Even though every cell is "filled", the hint system should still see
    // empty cells (since all user entries are wrong) and produce a hint
    const hint = getHint(initial, current, solution);
    expect(hint).not.toBeNull();
  });

  it("should handle a mix of correct and incorrect entries", () => {
    const { initial, solution } = setup();
    const current = [...initial];
    const empties = emptyCells(initial);

    // Even indices: correct, odd indices: wrong
    for (let i = 0; i < empties.length; i++) {
      const idx = empties[i];
      if (i % 2 === 0) {
        current[idx] = solution[idx];
      } else {
        current[idx] = solution[idx] === 9 ? 1 : solution[idx] + 1;
      }
    }

    // Build the expected clean board manually
    const expectedClean = [...initial];
    for (let i = 0; i < empties.length; i++) {
      if (i % 2 === 0) expectedClean[empties[i]] = solution[empties[i]];
    }

    const hint = getHint(initial, current, solution);
    const hintFromClean = getHint(initial, expectedClean, solution);

    expect(hint).not.toBeNull();
    expect(hintFromClean).not.toBeNull();
    expect(hint!.technique).toBe(hintFromClean!.technique);
    expect(hint!.cells).toEqual(hintFromClean!.cells);
    expect(hint!.placements).toEqual(hintFromClean!.placements);
  });
});
