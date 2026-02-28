import type { Grid } from "./types";
import { cloneGrid } from "./utils";

/**
 * Check if placing `val` at grid[row][col] is valid
 * (no conflict with row, column, or 3x3 box).
 */
function isValid(grid: Grid, row: number, col: number, val: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === val) return false;
    if (grid[i][col] === val) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === val) return false;
    }
  }
  return true;
}

/**
 * Shuffle an array in place using Fisher-Yates.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Count solutions of the given grid up to `limit`, then stop.
 * Returns the number of solutions found (capped at `limit`).
 */
export function countSolutions(grid: Grid, limit: number): number {
  // Find first empty cell
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        let count = 0;
        for (let val = 1; val <= 9; val++) {
          if (isValid(grid, r, c, val)) {
            grid[r][c] = val;
            count += countSolutions(grid, limit - count);
            grid[r][c] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  // No empty cell found — this is a complete solution
  return 1;
}

/**
 * Check if a grid has exactly one solution.
 */
export function hasUniqueSolution(grid: Grid): boolean {
  const clone = cloneGrid(grid);
  return countSolutions(clone, 2) === 1;
}

/**
 * Generate a complete valid 9x9 sudoku grid using backtracking
 * with randomized candidate selection.
 */
export function generateSolvedGrid(): Grid {
  const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(0));

  function fill(pos: number): boolean {
    if (pos === 81) return true;
    const r = Math.floor(pos / 9);
    const c = pos % 9;

    const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const val of candidates) {
      if (isValid(grid, r, c, val)) {
        grid[r][c] = val;
        if (fill(pos + 1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  fill(0);
  return grid;
}

/**
 * Generate a puzzle by starting from a solved grid, then removing clues
 * one at a time in random order. After each removal, verify the puzzle
 * still has exactly one solution.
 *
 * @param maxRemovals - Stop after removing this many clues (default: unlimited).
 *   Use lower values (e.g. 40-45) to produce easier puzzles with more clues.
 */
export function generatePuzzle(maxRemovals?: number): { puzzle: Grid; solution: Grid } {
  const solution = generateSolvedGrid();
  const puzzle = cloneGrid(solution);

  // Create a list of all 81 cell positions in random order
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

  let removed = 0;
  for (const [r, c] of positions) {
    if (maxRemovals !== undefined && removed >= maxRemovals) break;

    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    if (!hasUniqueSolution(puzzle)) {
      // Removing this clue breaks uniqueness — put it back
      puzzle[r][c] = backup;
    } else {
      removed++;
    }
  }

  return { puzzle, solution };
}
