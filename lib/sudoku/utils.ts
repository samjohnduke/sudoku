import type { Grid } from "./types";

export function parseGrid(s: string): Grid {
  const grid: Grid = [];
  for (let r = 0; r < 9; r++) {
    grid.push([]);
    for (let c = 0; c < 9; c++) {
      const ch = s[r * 9 + c];
      grid[r].push(ch === "." || ch === "0" ? 0 : parseInt(ch));
    }
  }
  return grid;
}

export function gridToString(grid: Grid): string {
  return grid
    .flat()
    .map((v) => (v === 0 ? "." : String(v)))
    .join("");
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}
