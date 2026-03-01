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
 * Build a "clean" board: initial clues + only user entries that match the
 * known solution. Wrong user entries are treated as empty so they don't
 * corrupt candidate computation.
 */
function buildCleanBoard(
  initial: number[],
  current: number[],
  solution: number[],
): number[] {
  const clean = new Array<number>(81);
  for (let i = 0; i < 81; i++) {
    if (initial[i] !== 0) {
      clean[i] = initial[i];
    } else if (current[i] !== 0 && current[i] === solution[i]) {
      clean[i] = current[i];
    } else {
      clean[i] = 0;
    }
  }
  return clean;
}

/**
 * Get a single hint for the current board state.
 * Uses initial clues + verified-correct user entries to avoid giving wrong
 * hints when the board contains incorrect values.
 * Returns null if no technique applies (board may be complete or broken).
 */
export function getHint(
  initial: number[],
  current: number[],
  solution: number[],
): SolveStep | null {
  const clean = buildCleanBoard(initial, current, solution);
  const grid = toGrid(clean);
  const candidates = initCandidates(grid);

  for (const apply of TECHNIQUE_PIPELINE) {
    const step = apply(grid, candidates);
    if (step) {
      return step;
    }
  }

  return null;
}
