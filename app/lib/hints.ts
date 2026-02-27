import type { SolveStep, Grid } from "../../lib/sudoku/types";
import {
  initCandidates,
  applyNakedSingle,
  applyHiddenSingle,
  applyNakedPair,
  applyNakedTriple,
  applyHiddenPair,
  applyHiddenTriple,
  applyPointingPairs,
  applyBoxLineReduction,
  applyNakedQuad,
  applyHiddenQuad,
  applyXWing,
  applySwordfish,
  applyXYWing,
  applySimpleColoring,
  applyJellyfish,
  applyUniqueRectangle,
} from "../../lib/sudoku/solver";

/**
 * Ordered list of technique functions, from easiest to hardest.
 * Mirrors the order used by humanSolve in the solver.
 */
const TECHNIQUE_PIPELINE = [
  applyNakedSingle,
  applyHiddenSingle,
  applyNakedPair,
  applyNakedTriple,
  applyHiddenPair,
  applyHiddenTriple,
  applyPointingPairs,
  applyBoxLineReduction,
  applyNakedQuad,
  applyHiddenQuad,
  applyXWing,
  applySwordfish,
  applyXYWing,
  applySimpleColoring,
  applyJellyfish,
  applyUniqueRectangle,
];

/**
 * Convert a flat 81-element board array into a 9x9 Grid.
 */
function toGrid(board: number[]): Grid {
  const grid: Grid = [];
  for (let r = 0; r < 9; r++) {
    grid.push(board.slice(r * 9, r * 9 + 9));
  }
  return grid;
}

/**
 * Get a single hint for the current board state.
 * Runs each technique in difficulty order and returns the first applicable step.
 * Returns null if no technique applies (board may be complete or broken).
 */
export function getHint(boardState: number[]): SolveStep | null {
  const grid = toGrid(boardState);
  const candidates = initCandidates(grid);

  for (const apply of TECHNIQUE_PIPELINE) {
    const step = apply(grid, candidates);
    if (step) {
      return step;
    }
  }

  return null;
}
