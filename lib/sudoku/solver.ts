import type { Grid, Candidates, SolveStep, SolveResult, Technique } from "./types";
import { cloneGrid } from "./utils";

// --- Unit helpers (precomputed for performance) ---

const ROW_CELLS: [number, number][][] = [];
const COL_CELLS: [number, number][][] = [];
const BOX_CELLS: [number, number][][] = [];
const PEERS: [number, number][][][] = []; // PEERS[r][c]

for (let i = 0; i < 9; i++) {
  const row: [number, number][] = [];
  const col: [number, number][] = [];
  for (let j = 0; j < 9; j++) {
    row.push([i, j]);
    col.push([j, i]);
  }
  ROW_CELLS.push(row);
  COL_CELLS.push(col);
}

for (let br = 0; br < 3; br++) {
  for (let bc = 0; bc < 3; bc++) {
    const box: [number, number][] = [];
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        box.push([br * 3 + dr, bc * 3 + dc]);
      }
    }
    BOX_CELLS.push(box);
  }
}

// Map each cell to its box index
const BOX_INDEX: number[][] = [];
for (let r = 0; r < 9; r++) {
  BOX_INDEX.push([]);
  for (let c = 0; c < 9; c++) {
    BOX_INDEX[r].push(Math.floor(r / 3) * 3 + Math.floor(c / 3));
  }
}

// Precompute peers for each cell
for (let r = 0; r < 9; r++) {
  PEERS.push([]);
  for (let c = 0; c < 9; c++) {
    const seen = new Set<string>();
    const peers: [number, number][] = [];
    for (const [pr, pc] of ROW_CELLS[r]) {
      if (pr === r && pc === c) continue;
      const key = `${pr},${pc}`;
      if (!seen.has(key)) {
        seen.add(key);
        peers.push([pr, pc]);
      }
    }
    for (const [pr, pc] of COL_CELLS[c]) {
      if (pr === r && pc === c) continue;
      const key = `${pr},${pc}`;
      if (!seen.has(key)) {
        seen.add(key);
        peers.push([pr, pc]);
      }
    }
    for (const [pr, pc] of BOX_CELLS[BOX_INDEX[r][c]]) {
      if (pr === r && pc === c) continue;
      const key = `${pr},${pc}`;
      if (!seen.has(key)) {
        seen.add(key);
        peers.push([pr, pc]);
      }
    }
    PEERS[r].push(peers);
  }
}

// --- Public helpers ---

export function getRow(row: number): [number, number][] {
  return ROW_CELLS[row];
}

export function getCol(col: number): [number, number][] {
  return COL_CELLS[col];
}

export function getBox(row: number, col: number): [number, number][] {
  return BOX_CELLS[BOX_INDEX[row][col]];
}

export function getPeers(row: number, col: number): [number, number][] {
  return PEERS[row][col];
}

// --- Candidates ---

export function initCandidates(grid: Grid): Candidates {
  const candidates: Candidates = [];
  for (let r = 0; r < 9; r++) {
    candidates.push([]);
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== 0) {
        candidates[r].push(new Set());
        continue;
      }
      const possible = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const [pr, pc] of PEERS[r][c]) {
        possible.delete(grid[pr][pc]);
      }
      // Also remove the cell's own value (always 0 here, but be safe)
      possible.delete(grid[r][c]);
      candidates[r].push(possible);
    }
  }
  return candidates;
}

// --- Placement ---

export function placeValue(
  grid: Grid,
  candidates: Candidates,
  row: number,
  col: number,
  value: number
): void {
  grid[row][col] = value;
  candidates[row][col].clear();
  for (const [pr, pc] of PEERS[row][col]) {
    candidates[pr][pc].delete(value);
  }
}

// --- Techniques ---

export function applyNakedSingle(
  grid: Grid,
  candidates: Candidates
): SolveStep | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (candidates[r][c].size === 1) {
        const value = [...candidates[r][c]][0];
        placeValue(grid, candidates, r, c, value);
        return {
          technique: "naked-single",
          cells: [[r, c]],
          values: [value],
          eliminations: [],
          placements: [{ cell: [r, c], value }],
          description: `R${r + 1}C${c + 1} can only be ${value} (naked single)`,
        };
      }
    }
  }
  return null;
}

export function applyHiddenSingle(
  grid: Grid,
  candidates: Candidates
): SolveStep | null {
  // Check all unit types: rows, columns, boxes
  const units: { cells: [number, number][]; label: string }[] = [];
  for (let i = 0; i < 9; i++) {
    units.push({ cells: ROW_CELLS[i], label: `row ${i + 1}` });
    units.push({ cells: COL_CELLS[i], label: `column ${i + 1}` });
    units.push({ cells: BOX_CELLS[i], label: `box ${i + 1}` });
  }

  for (const { cells, label } of units) {
    for (let v = 1; v <= 9; v++) {
      let count = 0;
      let lastR = -1;
      let lastC = -1;
      for (const [r, c] of cells) {
        if (candidates[r][c].has(v)) {
          count++;
          lastR = r;
          lastC = c;
        }
      }
      if (count === 1) {
        placeValue(grid, candidates, lastR, lastC, v);
        return {
          technique: "hidden-single",
          cells: [[lastR, lastC]],
          values: [v],
          eliminations: [],
          placements: [{ cell: [lastR, lastC], value: v }],
          description: `R${lastR + 1}C${lastC + 1} = ${v} (hidden single in ${label})`,
        };
      }
    }
  }
  return null;
}

// --- Helper: get all units ---

function allUnits(): { cells: [number, number][]; label: string }[] {
  const units: { cells: [number, number][]; label: string }[] = [];
  for (let i = 0; i < 9; i++) {
    units.push({ cells: ROW_CELLS[i], label: `row ${i + 1}` });
    units.push({ cells: COL_CELLS[i], label: `column ${i + 1}` });
    units.push({ cells: BOX_CELLS[i], label: `box ${i + 1}` });
  }
  return units;
}

// --- Helper: cells sharing a unit ---

function cellsSeeEachOther(
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  return (
    r1 === r2 ||
    c1 === c2 ||
    BOX_INDEX[r1][c1] === BOX_INDEX[r2][c2]
  );
}

// --- Helper: combinations ---

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const rest = combinations(arr.slice(i + 1), k - 1);
    for (const combo of rest) {
      result.push([arr[i], ...combo]);
    }
  }
  return result;
}

// --- Naked Pair ---

export function applyNakedPair(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  for (const { cells, label } of allUnits()) {
    // Find cells with exactly 2 candidates
    const twos: [number, number][] = [];
    for (const [r, c] of cells) {
      if (candidates[r][c].size === 2) twos.push([r, c]);
    }
    for (let i = 0; i < twos.length; i++) {
      for (let j = i + 1; j < twos.length; j++) {
        const [r1, c1] = twos[i];
        const [r2, c2] = twos[j];
        const s1 = candidates[r1][c1];
        const s2 = candidates[r2][c2];
        // Check same 2 candidates
        if (s1.size !== 2 || s2.size !== 2) continue;
        const vals = [...s1];
        if (!s2.has(vals[0]) || !s2.has(vals[1])) continue;

        // Eliminate from other cells in unit
        const eliminations: { cell: [number, number]; value: number }[] = [];
        for (const [r, c] of cells) {
          if ((r === r1 && c === c1) || (r === r2 && c === c2)) continue;
          for (const v of vals) {
            if (candidates[r][c].has(v)) {
              candidates[r][c].delete(v);
              eliminations.push({ cell: [r, c], value: v });
            }
          }
        }
        if (eliminations.length > 0) {
          return {
            technique: "naked-pair",
            cells: [twos[i], twos[j]],
            values: vals,
            eliminations,
            placements: [],
            description: `Naked pair {${vals.join(",")}} in R${r1 + 1}C${c1 + 1} and R${r2 + 1}C${c2 + 1} in ${label}`,
          };
        }
      }
    }
  }
  return null;
}

// --- Naked Triple ---

export function applyNakedTriple(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  for (const { cells, label } of allUnits()) {
    // Cells with 2 or 3 candidates
    const eligible: [number, number][] = [];
    for (const [r, c] of cells) {
      const sz = candidates[r][c].size;
      if (sz >= 2 && sz <= 3) eligible.push([r, c]);
    }
    if (eligible.length < 3) continue;

    for (const combo of combinations(eligible, 3)) {
      const union = new Set<number>();
      for (const [r, c] of combo) {
        for (const v of candidates[r][c]) union.add(v);
      }
      if (union.size !== 3) continue;

      const vals = [...union];
      const eliminations: { cell: [number, number]; value: number }[] = [];
      const comboSet = new Set(combo.map(([r, c]) => `${r},${c}`));
      for (const [r, c] of cells) {
        if (comboSet.has(`${r},${c}`)) continue;
        for (const v of vals) {
          if (candidates[r][c].has(v)) {
            candidates[r][c].delete(v);
            eliminations.push({ cell: [r, c], value: v });
          }
        }
      }
      if (eliminations.length > 0) {
        const cellDesc = combo
          .map(([r, c]) => `R${r + 1}C${c + 1}`)
          .join(", ");
        return {
          technique: "naked-triple",
          cells: combo,
          values: vals,
          eliminations,
          placements: [],
          description: `Naked triple {${vals.join(",")}} in ${cellDesc} in ${label}`,
        };
      }
    }
  }
  return null;
}

// --- Hidden Pair ---

export function applyHiddenPair(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  for (const { cells, label } of allUnits()) {
    // For each value, find which cells have it
    const valueCells: Map<number, [number, number][]> = new Map();
    for (let v = 1; v <= 9; v++) {
      const cs: [number, number][] = [];
      for (const [r, c] of cells) {
        if (candidates[r][c].has(v)) cs.push([r, c]);
      }
      if (cs.length >= 2 && cs.length <= 8) valueCells.set(v, cs);
    }

    const vals = [...valueCells.keys()];
    for (let i = 0; i < vals.length; i++) {
      for (let j = i + 1; j < vals.length; j++) {
        const cells1 = valueCells.get(vals[i])!;
        const cells2 = valueCells.get(vals[j])!;
        if (cells1.length !== 2 || cells2.length !== 2) continue;
        // Check same 2 cells
        if (
          cells1[0][0] !== cells2[0][0] ||
          cells1[0][1] !== cells2[0][1] ||
          cells1[1][0] !== cells2[1][0] ||
          cells1[1][1] !== cells2[1][1]
        )
          continue;

        const pairVals = [vals[i], vals[j]];
        const pairCells = cells1;
        // Eliminate other candidates from these 2 cells
        const eliminations: { cell: [number, number]; value: number }[] = [];
        for (const [r, c] of pairCells) {
          for (const v of [...candidates[r][c]]) {
            if (!pairVals.includes(v)) {
              candidates[r][c].delete(v);
              eliminations.push({ cell: [r, c], value: v });
            }
          }
        }
        if (eliminations.length > 0) {
          return {
            technique: "hidden-pair",
            cells: [...pairCells],
            values: pairVals,
            eliminations,
            placements: [],
            description: `Hidden pair {${pairVals.join(",")}} in R${pairCells[0][0] + 1}C${pairCells[0][1] + 1} and R${pairCells[1][0] + 1}C${pairCells[1][1] + 1} in ${label}`,
          };
        }
      }
    }
  }
  return null;
}

// --- Hidden Triple ---

export function applyHiddenTriple(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  for (const { cells, label } of allUnits()) {
    const valueCells: Map<number, [number, number][]> = new Map();
    for (let v = 1; v <= 9; v++) {
      const cs: [number, number][] = [];
      for (const [r, c] of cells) {
        if (candidates[r][c].has(v)) cs.push([r, c]);
      }
      if (cs.length >= 2 && cs.length <= 3) valueCells.set(v, cs);
    }

    const vals = [...valueCells.keys()];
    if (vals.length < 3) continue;

    for (const valCombo of combinations(vals, 3)) {
      // Union of cells for these 3 values
      const cellSet = new Set<string>();
      for (const v of valCombo) {
        for (const [r, c] of valueCells.get(v)!) {
          cellSet.add(`${r},${c}`);
        }
      }
      if (cellSet.size !== 3) continue;

      const tripleCells: [number, number][] = [...cellSet].map((s) => {
        const [r, c] = s.split(",").map(Number);
        return [r, c] as [number, number];
      });

      // Eliminate other candidates from these 3 cells
      const eliminations: { cell: [number, number]; value: number }[] = [];
      for (const [r, c] of tripleCells) {
        for (const v of [...candidates[r][c]]) {
          if (!valCombo.includes(v)) {
            candidates[r][c].delete(v);
            eliminations.push({ cell: [r, c], value: v });
          }
        }
      }
      if (eliminations.length > 0) {
        const cellDesc = tripleCells
          .map(([r, c]) => `R${r + 1}C${c + 1}`)
          .join(", ");
        return {
          technique: "hidden-triple",
          cells: tripleCells,
          values: valCombo,
          eliminations,
          placements: [],
          description: `Hidden triple {${valCombo.join(",")}} in ${cellDesc} in ${label}`,
        };
      }
    }
  }
  return null;
}

// --- Pointing Pairs/Triples ---

export function applyPointingPairs(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  for (let box = 0; box < 9; box++) {
    const boxCells = BOX_CELLS[box];
    for (let v = 1; v <= 9; v++) {
      const cellsWithV: [number, number][] = [];
      for (const [r, c] of boxCells) {
        if (candidates[r][c].has(v)) cellsWithV.push([r, c]);
      }
      if (cellsWithV.length < 2 || cellsWithV.length > 3) continue;

      // Check if all in same row
      const rows = new Set(cellsWithV.map(([r]) => r));
      if (rows.size === 1) {
        const row = cellsWithV[0][0];
        const eliminations: { cell: [number, number]; value: number }[] = [];
        for (const [r, c] of ROW_CELLS[row]) {
          if (BOX_INDEX[r][c] === box) continue;
          if (candidates[r][c].has(v)) {
            candidates[r][c].delete(v);
            eliminations.push({ cell: [r, c], value: v });
          }
        }
        if (eliminations.length > 0) {
          return {
            technique: "pointing-pairs",
            cells: cellsWithV,
            values: [v],
            eliminations,
            placements: [],
            description: `Pointing ${cellsWithV.length === 2 ? "pair" : "triple"}: ${v} in box ${box + 1} restricted to row ${row + 1}`,
          };
        }
      }

      // Check if all in same column
      const cols = new Set(cellsWithV.map(([, c]) => c));
      if (cols.size === 1) {
        const col = cellsWithV[0][1];
        const eliminations: { cell: [number, number]; value: number }[] = [];
        for (const [r, c] of COL_CELLS[col]) {
          if (BOX_INDEX[r][c] === box) continue;
          if (candidates[r][c].has(v)) {
            candidates[r][c].delete(v);
            eliminations.push({ cell: [r, c], value: v });
          }
        }
        if (eliminations.length > 0) {
          return {
            technique: "pointing-pairs",
            cells: cellsWithV,
            values: [v],
            eliminations,
            placements: [],
            description: `Pointing ${cellsWithV.length === 2 ? "pair" : "triple"}: ${v} in box ${box + 1} restricted to column ${col + 1}`,
          };
        }
      }
    }
  }
  return null;
}

// --- Box/Line Reduction ---

export function applyBoxLineReduction(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let v = 1; v <= 9; v++) {
      const cellsWithV: [number, number][] = [];
      for (const [r, c] of ROW_CELLS[row]) {
        if (candidates[r][c].has(v)) cellsWithV.push([r, c]);
      }
      if (cellsWithV.length < 2 || cellsWithV.length > 3) continue;

      const boxes = new Set(cellsWithV.map(([r, c]) => BOX_INDEX[r][c]));
      if (boxes.size === 1) {
        const box = [...boxes][0];
        const eliminations: { cell: [number, number]; value: number }[] = [];
        for (const [r, c] of BOX_CELLS[box]) {
          if (r === row) continue;
          if (candidates[r][c].has(v)) {
            candidates[r][c].delete(v);
            eliminations.push({ cell: [r, c], value: v });
          }
        }
        if (eliminations.length > 0) {
          return {
            technique: "box-line-reduction",
            cells: cellsWithV,
            values: [v],
            eliminations,
            placements: [],
            description: `Box/line reduction: ${v} in row ${row + 1} confined to box ${box + 1}`,
          };
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let v = 1; v <= 9; v++) {
      const cellsWithV: [number, number][] = [];
      for (const [r, c] of COL_CELLS[col]) {
        if (candidates[r][c].has(v)) cellsWithV.push([r, c]);
      }
      if (cellsWithV.length < 2 || cellsWithV.length > 3) continue;

      const boxes = new Set(cellsWithV.map(([r, c]) => BOX_INDEX[r][c]));
      if (boxes.size === 1) {
        const box = [...boxes][0];
        const eliminations: { cell: [number, number]; value: number }[] = [];
        for (const [r, c] of BOX_CELLS[box]) {
          if (c === col) continue;
          if (candidates[r][c].has(v)) {
            candidates[r][c].delete(v);
            eliminations.push({ cell: [r, c], value: v });
          }
        }
        if (eliminations.length > 0) {
          return {
            technique: "box-line-reduction",
            cells: cellsWithV,
            values: [v],
            eliminations,
            placements: [],
            description: `Box/line reduction: ${v} in column ${col + 1} confined to box ${box + 1}`,
          };
        }
      }
    }
  }
  return null;
}

// --- Naked Quad ---

export function applyNakedQuad(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  for (const { cells, label } of allUnits()) {
    const eligible: [number, number][] = [];
    for (const [r, c] of cells) {
      const sz = candidates[r][c].size;
      if (sz >= 2 && sz <= 4) eligible.push([r, c]);
    }
    if (eligible.length < 4) continue;

    for (const combo of combinations(eligible, 4)) {
      const union = new Set<number>();
      for (const [r, c] of combo) {
        for (const v of candidates[r][c]) union.add(v);
      }
      if (union.size !== 4) continue;

      const vals = [...union];
      const eliminations: { cell: [number, number]; value: number }[] = [];
      const comboSet = new Set(combo.map(([r, c]) => `${r},${c}`));
      for (const [r, c] of cells) {
        if (comboSet.has(`${r},${c}`)) continue;
        for (const v of vals) {
          if (candidates[r][c].has(v)) {
            candidates[r][c].delete(v);
            eliminations.push({ cell: [r, c], value: v });
          }
        }
      }
      if (eliminations.length > 0) {
        const cellDesc = combo
          .map(([r, c]) => `R${r + 1}C${c + 1}`)
          .join(", ");
        return {
          technique: "naked-quad",
          cells: combo,
          values: vals,
          eliminations,
          placements: [],
          description: `Naked quad {${vals.join(",")}} in ${cellDesc} in ${label}`,
        };
      }
    }
  }
  return null;
}

// --- Hidden Quad ---

export function applyHiddenQuad(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  for (const { cells, label } of allUnits()) {
    const valueCells: Map<number, [number, number][]> = new Map();
    for (let v = 1; v <= 9; v++) {
      const cs: [number, number][] = [];
      for (const [r, c] of cells) {
        if (candidates[r][c].has(v)) cs.push([r, c]);
      }
      if (cs.length >= 2 && cs.length <= 4) valueCells.set(v, cs);
    }

    const vals = [...valueCells.keys()];
    if (vals.length < 4) continue;

    for (const valCombo of combinations(vals, 4)) {
      const cellSet = new Set<string>();
      for (const v of valCombo) {
        for (const [r, c] of valueCells.get(v)!) {
          cellSet.add(`${r},${c}`);
        }
      }
      if (cellSet.size !== 4) continue;

      const quadCells: [number, number][] = [...cellSet].map((s) => {
        const [r, c] = s.split(",").map(Number);
        return [r, c] as [number, number];
      });

      const eliminations: { cell: [number, number]; value: number }[] = [];
      for (const [r, c] of quadCells) {
        for (const v of [...candidates[r][c]]) {
          if (!valCombo.includes(v)) {
            candidates[r][c].delete(v);
            eliminations.push({ cell: [r, c], value: v });
          }
        }
      }
      if (eliminations.length > 0) {
        const cellDesc = quadCells
          .map(([r, c]) => `R${r + 1}C${c + 1}`)
          .join(", ");
        return {
          technique: "hidden-quad",
          cells: quadCells,
          values: valCombo,
          eliminations,
          placements: [],
          description: `Hidden quad {${valCombo.join(",")}} in ${cellDesc} in ${label}`,
        };
      }
    }
  }
  return null;
}

// --- X-Wing ---

export function applyXWing(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  // Row-based X-Wing
  for (let v = 1; v <= 9; v++) {
    // Find rows where v appears in exactly 2 columns
    const rowPairs: { row: number; cols: number[] }[] = [];
    for (let r = 0; r < 9; r++) {
      const cols: number[] = [];
      for (let c = 0; c < 9; c++) {
        if (candidates[r][c].has(v)) cols.push(c);
      }
      if (cols.length === 2) rowPairs.push({ row: r, cols });
    }

    for (let i = 0; i < rowPairs.length; i++) {
      for (let j = i + 1; j < rowPairs.length; j++) {
        if (
          rowPairs[i].cols[0] !== rowPairs[j].cols[0] ||
          rowPairs[i].cols[1] !== rowPairs[j].cols[1]
        )
          continue;

        const [c1, c2] = rowPairs[i].cols;
        const r1 = rowPairs[i].row;
        const r2 = rowPairs[j].row;
        const eliminations: { cell: [number, number]; value: number }[] = [];

        // Eliminate v from those 2 columns in all other rows
        for (let r = 0; r < 9; r++) {
          if (r === r1 || r === r2) continue;
          if (candidates[r][c1].has(v)) {
            candidates[r][c1].delete(v);
            eliminations.push({ cell: [r, c1], value: v });
          }
          if (candidates[r][c2].has(v)) {
            candidates[r][c2].delete(v);
            eliminations.push({ cell: [r, c2], value: v });
          }
        }
        if (eliminations.length > 0) {
          return {
            technique: "x-wing",
            cells: [
              [r1, c1],
              [r1, c2],
              [r2, c1],
              [r2, c2],
            ],
            values: [v],
            eliminations,
            placements: [],
            description: `X-Wing: ${v} in rows ${r1 + 1},${r2 + 1} and columns ${c1 + 1},${c2 + 1}`,
          };
        }
      }
    }

    // Column-based X-Wing
    const colPairs: { col: number; rows: number[] }[] = [];
    for (let c = 0; c < 9; c++) {
      const rows: number[] = [];
      for (let r = 0; r < 9; r++) {
        if (candidates[r][c].has(v)) rows.push(r);
      }
      if (rows.length === 2) colPairs.push({ col: c, rows });
    }

    for (let i = 0; i < colPairs.length; i++) {
      for (let j = i + 1; j < colPairs.length; j++) {
        if (
          colPairs[i].rows[0] !== colPairs[j].rows[0] ||
          colPairs[i].rows[1] !== colPairs[j].rows[1]
        )
          continue;

        const [r1, r2] = colPairs[i].rows;
        const c1 = colPairs[i].col;
        const c2 = colPairs[j].col;
        const eliminations: { cell: [number, number]; value: number }[] = [];

        for (let c = 0; c < 9; c++) {
          if (c === c1 || c === c2) continue;
          if (candidates[r1][c].has(v)) {
            candidates[r1][c].delete(v);
            eliminations.push({ cell: [r1, c], value: v });
          }
          if (candidates[r2][c].has(v)) {
            candidates[r2][c].delete(v);
            eliminations.push({ cell: [r2, c], value: v });
          }
        }
        if (eliminations.length > 0) {
          return {
            technique: "x-wing",
            cells: [
              [r1, c1],
              [r1, c2],
              [r2, c1],
              [r2, c2],
            ],
            values: [v],
            eliminations,
            placements: [],
            description: `X-Wing: ${v} in columns ${c1 + 1},${c2 + 1} and rows ${r1 + 1},${r2 + 1}`,
          };
        }
      }
    }
  }
  return null;
}

// --- Swordfish ---

function applyFish(
  _grid: Grid,
  candidates: Candidates,
  size: number,
  technique: Technique
): SolveStep | null {
  const fishName =
    size === 3 ? "Swordfish" : size === 4 ? "Jellyfish" : `Fish-${size}`;

  for (let v = 1; v <= 9; v++) {
    // Row-based
    const rowData: { row: number; cols: Set<number> }[] = [];
    for (let r = 0; r < 9; r++) {
      const cols = new Set<number>();
      for (let c = 0; c < 9; c++) {
        if (candidates[r][c].has(v)) cols.add(c);
      }
      if (cols.size >= 2 && cols.size <= size) rowData.push({ row: r, cols });
    }

    if (rowData.length >= size) {
      for (const combo of combinations(rowData, size)) {
        const allCols = new Set<number>();
        for (const { cols } of combo) {
          for (const c of cols) allCols.add(c);
        }
        if (allCols.size !== size) continue;

        const rows = new Set(combo.map((d) => d.row));
        const eliminations: { cell: [number, number]; value: number }[] = [];
        for (const c of allCols) {
          for (let r = 0; r < 9; r++) {
            if (rows.has(r)) continue;
            if (candidates[r][c].has(v)) {
              candidates[r][c].delete(v);
              eliminations.push({ cell: [r, c], value: v });
            }
          }
        }
        if (eliminations.length > 0) {
          const fishCells: [number, number][] = [];
          for (const { row, cols } of combo) {
            for (const c of cols) fishCells.push([row, c]);
          }
          return {
            technique,
            cells: fishCells,
            values: [v],
            eliminations,
            placements: [],
            description: `${fishName}: ${v} in rows ${[...rows].map((r) => r + 1).join(",")} and columns ${[...allCols].map((c) => c + 1).join(",")}`,
          };
        }
      }
    }

    // Column-based
    const colData: { col: number; rows: Set<number> }[] = [];
    for (let c = 0; c < 9; c++) {
      const rows = new Set<number>();
      for (let r = 0; r < 9; r++) {
        if (candidates[r][c].has(v)) rows.add(r);
      }
      if (rows.size >= 2 && rows.size <= size) colData.push({ col: c, rows });
    }

    if (colData.length >= size) {
      for (const combo of combinations(colData, size)) {
        const allRows = new Set<number>();
        for (const { rows } of combo) {
          for (const r of rows) allRows.add(r);
        }
        if (allRows.size !== size) continue;

        const cols = new Set(combo.map((d) => d.col));
        const eliminations: { cell: [number, number]; value: number }[] = [];
        for (const r of allRows) {
          for (let c = 0; c < 9; c++) {
            if (cols.has(c)) continue;
            if (candidates[r][c].has(v)) {
              candidates[r][c].delete(v);
              eliminations.push({ cell: [r, c], value: v });
            }
          }
        }
        if (eliminations.length > 0) {
          const fishCells: [number, number][] = [];
          for (const { col, rows } of combo) {
            for (const r of rows) fishCells.push([r, col]);
          }
          return {
            technique,
            cells: fishCells,
            values: [v],
            eliminations,
            placements: [],
            description: `${fishName}: ${v} in columns ${[...cols].map((c) => c + 1).join(",")} and rows ${[...allRows].map((r) => r + 1).join(",")}`,
          };
        }
      }
    }
  }
  return null;
}

export function applySwordfish(
  grid: Grid,
  candidates: Candidates
): SolveStep | null {
  return applyFish(grid, candidates, 3, "swordfish");
}

export function applyJellyfish(
  grid: Grid,
  candidates: Candidates
): SolveStep | null {
  return applyFish(grid, candidates, 4, "jellyfish");
}

// --- XY-Wing ---

export function applyXYWing(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  // Find all cells with exactly 2 candidates (bivalue cells)
  const bivalueCells: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (candidates[r][c].size === 2) bivalueCells.push([r, c]);
    }
  }

  for (const [pr, pc] of bivalueCells) {
    const pivotVals = [...candidates[pr][pc]];
    const x = pivotVals[0];
    const y = pivotVals[1];

    // Find wing1: shares unit with pivot, has candidates {X, Z} where Z != Y
    const pivotPeers = PEERS[pr][pc];
    const wings1: { cell: [number, number]; z: number }[] = [];
    for (const [wr, wc] of pivotPeers) {
      if (candidates[wr][wc].size !== 2) continue;
      const wVals = [...candidates[wr][wc]];
      if (wVals.includes(x) && !wVals.includes(y)) {
        const z = wVals[0] === x ? wVals[1] : wVals[0];
        wings1.push({ cell: [wr, wc], z });
      }
    }

    for (const w1 of wings1) {
      const z = w1.z;
      // Find wing2: shares unit with pivot, has candidates {Y, Z}
      for (const [wr, wc] of pivotPeers) {
        if (wr === w1.cell[0] && wc === w1.cell[1]) continue;
        if (candidates[wr][wc].size !== 2) continue;
        const wVals = [...candidates[wr][wc]];
        if (wVals.includes(y) && wVals.includes(z)) {
          // Found XY-Wing. Eliminate Z from cells that see both wings.
          const eliminations: { cell: [number, number]; value: number }[] = [];
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              if (r === pr && c === pc) continue;
              if (r === w1.cell[0] && c === w1.cell[1]) continue;
              if (r === wr && c === wc) continue;
              if (!candidates[r][c].has(z)) continue;
              if (
                cellsSeeEachOther(r, c, w1.cell[0], w1.cell[1]) &&
                cellsSeeEachOther(r, c, wr, wc)
              ) {
                candidates[r][c].delete(z);
                eliminations.push({ cell: [r, c], value: z });
              }
            }
          }
          if (eliminations.length > 0) {
            return {
              technique: "xy-wing",
              cells: [[pr, pc], w1.cell, [wr, wc]],
              values: [x, y, z],
              eliminations,
              placements: [],
              description: `XY-Wing: pivot R${pr + 1}C${pc + 1} {${x},${y}}, wings R${w1.cell[0] + 1}C${w1.cell[1] + 1} {${x},${z}} and R${wr + 1}C${wc + 1} {${y},${z}} — eliminate ${z}`,
            };
          }
        }
      }
    }
  }
  return null;
}

// --- Simple Coloring ---

export function applySimpleColoring(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  for (let v = 1; v <= 9; v++) {
    // Build conjugate pair graph
    // A conjugate pair: two cells in a unit where v appears in exactly 2 cells
    const adj: Map<string, Set<string>> = new Map();
    const cellKey = (r: number, c: number) => `${r},${c}`;

    const unitsList = [
      ...ROW_CELLS.map((cells) => cells),
      ...COL_CELLS.map((cells) => cells),
      ...BOX_CELLS.map((cells) => cells),
    ];

    for (const unit of unitsList) {
      const withV: [number, number][] = [];
      for (const [r, c] of unit) {
        if (candidates[r][c].has(v)) withV.push([r, c]);
      }
      if (withV.length === 2) {
        const k1 = cellKey(withV[0][0], withV[0][1]);
        const k2 = cellKey(withV[1][0], withV[1][1]);
        if (!adj.has(k1)) adj.set(k1, new Set());
        if (!adj.has(k2)) adj.set(k2, new Set());
        adj.get(k1)!.add(k2);
        adj.get(k2)!.add(k1);
      }
    }

    if (adj.size === 0) continue;

    // BFS to color each connected component
    const color: Map<string, number> = new Map();
    const visited = new Set<string>();

    for (const start of adj.keys()) {
      if (visited.has(start)) continue;
      const queue: { key: string; col: number }[] = [{ key: start, col: 0 }];
      visited.add(start);
      color.set(start, 0);
      const component: string[] = [start];

      while (queue.length > 0) {
        const { key, col } = queue.shift()!;
        for (const neighbor of adj.get(key) || []) {
          if (visited.has(neighbor)) continue;
          visited.add(neighbor);
          color.set(neighbor, 1 - col);
          component.push(neighbor);
          queue.push({ key: neighbor, col: 1 - col });
        }
      }

      if (component.length < 2) continue;

      const color0: [number, number][] = [];
      const color1: [number, number][] = [];
      for (const k of component) {
        const [r, c] = k.split(",").map(Number);
        if (color.get(k) === 0) color0.push([r, c]);
        else color1.push([r, c]);
      }

      // Rule 1: If two cells of the same color see each other, that color is false
      for (const group of [color0, color1]) {
        let conflict = false;
        for (let i = 0; i < group.length && !conflict; i++) {
          for (let j = i + 1; j < group.length && !conflict; j++) {
            if (
              cellsSeeEachOther(
                group[i][0],
                group[i][1],
                group[j][0],
                group[j][1]
              )
            ) {
              conflict = true;
            }
          }
        }
        if (conflict) {
          const eliminations: { cell: [number, number]; value: number }[] = [];
          for (const [r, c] of group) {
            if (candidates[r][c].has(v)) {
              candidates[r][c].delete(v);
              eliminations.push({ cell: [r, c], value: v });
            }
          }
          if (eliminations.length > 0) {
            return {
              technique: "simple-coloring",
              cells: [...color0, ...color1],
              values: [v],
              eliminations,
              placements: [],
              description: `Simple coloring on ${v}: same-color cells see each other, eliminate ${v} from that color group`,
            };
          }
        }
      }

      // Rule 2: If a cell outside the chain sees both colors, eliminate v from it
      const eliminations: { cell: [number, number]; value: number }[] = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!candidates[r][c].has(v)) continue;
          const k = cellKey(r, c);
          if (color.has(k)) continue;

          let seesColor0 = false;
          let seesColor1 = false;
          for (const [cr, cc] of color0) {
            if (cellsSeeEachOther(r, c, cr, cc)) {
              seesColor0 = true;
              break;
            }
          }
          for (const [cr, cc] of color1) {
            if (cellsSeeEachOther(r, c, cr, cc)) {
              seesColor1 = true;
              break;
            }
          }
          if (seesColor0 && seesColor1) {
            candidates[r][c].delete(v);
            eliminations.push({ cell: [r, c], value: v });
          }
        }
      }
      if (eliminations.length > 0) {
        return {
          technique: "simple-coloring",
          cells: [...color0, ...color1],
          values: [v],
          eliminations,
          placements: [],
          description: `Simple coloring on ${v}: cells seeing both colors lose candidate ${v}`,
        };
      }
    }
  }
  return null;
}

// --- Unique Rectangle ---

export function applyUniqueRectangle(
  _grid: Grid,
  candidates: Candidates
): SolveStep | null {
  // Type 1: 3 corners have exactly {a, b}, 4th corner has {a, b, ...}
  // Eliminate a and b from 4th corner (if it has extras) to prevent deadly pattern
  // Actually: eliminate the pair values from the 4th corner only if the 4th corner
  // has the pair values plus extras. We eliminate the pair values from the 4th corner.
  // Wait — Type 1: 3 corners bivalue {a,b}, 4th corner has {a,b} + extras.
  // We eliminate a,b from the 4th corner.

  // Find all bivalue cells
  const bivalueCells: Map<string, [number, number]> = new Map();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (candidates[r][c].size === 2) {
        bivalueCells.set(`${r},${c}`, [r, c]);
      }
    }
  }

  // For each pair of bivalue cells in the same row with same candidates
  for (const [k1, [r1, c1]] of bivalueCells) {
    for (const [k2, [r2, c2]] of bivalueCells) {
      if (k1 >= k2) continue;
      if (r1 !== r2) continue; // same row
      const s1 = candidates[r1][c1];
      const s2 = candidates[r2][c2];
      const vals1 = [...s1];
      if (vals1.length !== 2) continue;
      if (!s2.has(vals1[0]) || !s2.has(vals1[1])) continue;
      if (s2.size !== 2) continue;

      const a = vals1[0];
      const b = vals1[1];

      // Find another row to form rectangle, must be in different boxes
      if (BOX_INDEX[r1][c1] === BOX_INDEX[r1][c2]) continue; // columns must be in different boxes

      for (let r3 = 0; r3 < 9; r3++) {
        if (r3 === r1) continue;
        // Same box constraint: the rectangle must span exactly 2 boxes
        if (BOX_INDEX[r3][c1] === BOX_INDEX[r3][c2]) continue;

        const hasA1 = candidates[r3][c1].has(a);
        const hasB1 = candidates[r3][c1].has(b);
        const hasA2 = candidates[r3][c2].has(a);
        const hasB2 = candidates[r3][c2].has(b);

        if (!hasA1 || !hasB1 || !hasA2 || !hasB2) continue;

        // Both cells in the bottom row have a and b
        // Type 1: one is bivalue {a,b}, the other has extras
        const sz1 = candidates[r3][c1].size;
        const sz2 = candidates[r3][c2].size;

        if (sz1 === 2 && sz2 > 2) {
          // r3,c2 is the 4th corner with extras — eliminate a,b from it
          const eliminations: { cell: [number, number]; value: number }[] = [];
          candidates[r3][c2].delete(a);
          eliminations.push({ cell: [r3, c2], value: a });
          candidates[r3][c2].delete(b);
          eliminations.push({ cell: [r3, c2], value: b });
          return {
            technique: "unique-rectangle",
            cells: [
              [r1, c1],
              [r1, c2],
              [r3, c1],
              [r3, c2],
            ],
            values: [a, b],
            eliminations,
            placements: [],
            description: `Unique rectangle type 1: {${a},${b}} in R${r1 + 1}C${c1 + 1}, R${r1 + 1}C${c2 + 1}, R${r3 + 1}C${c1 + 1} — eliminate {${a},${b}} from R${r3 + 1}C${c2 + 1}`,
          };
        }

        if (sz2 === 2 && sz1 > 2) {
          const eliminations: { cell: [number, number]; value: number }[] = [];
          candidates[r3][c1].delete(a);
          eliminations.push({ cell: [r3, c1], value: a });
          candidates[r3][c1].delete(b);
          eliminations.push({ cell: [r3, c1], value: b });
          return {
            technique: "unique-rectangle",
            cells: [
              [r1, c1],
              [r1, c2],
              [r3, c1],
              [r3, c2],
            ],
            values: [a, b],
            eliminations,
            placements: [],
            description: `Unique rectangle type 1: {${a},${b}} in R${r1 + 1}C${c1 + 1}, R${r1 + 1}C${c2 + 1}, R${r3 + 1}C${c2 + 1} — eliminate {${a},${b}} from R${r3 + 1}C${c1 + 1}`,
          };
        }
      }
    }
  }
  return null;
}

// --- Main solver ---

type TechniqueApplier = (grid: Grid, candidates: Candidates) => SolveStep | null;

const TECHNIQUES: { name: Technique; apply: TechniqueApplier }[] = [
  { name: "naked-single", apply: applyNakedSingle },
  { name: "hidden-single", apply: applyHiddenSingle },
  { name: "naked-pair", apply: applyNakedPair },
  { name: "naked-triple", apply: applyNakedTriple },
  { name: "hidden-pair", apply: applyHiddenPair },
  { name: "hidden-triple", apply: applyHiddenTriple },
  { name: "pointing-pairs", apply: applyPointingPairs },
  { name: "box-line-reduction", apply: applyBoxLineReduction },
  { name: "naked-quad", apply: applyNakedQuad },
  { name: "hidden-quad", apply: applyHiddenQuad },
  { name: "x-wing", apply: applyXWing },
  { name: "swordfish", apply: applySwordfish },
  { name: "xy-wing", apply: applyXYWing },
  { name: "simple-coloring", apply: applySimpleColoring },
  { name: "jellyfish", apply: applyJellyfish },
  { name: "unique-rectangle", apply: applyUniqueRectangle },
];

export function humanSolve(inputGrid: Grid): SolveResult {
  const grid = cloneGrid(inputGrid);
  const candidates = initCandidates(grid);
  const steps: SolveStep[] = [];
  const techniquesUsed = new Set<Technique>();

  let progress = true;
  while (progress) {
    progress = false;

    // Check if solved
    let emptyCells = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) emptyCells++;
      }
    }
    if (emptyCells === 0) {
      return { solved: true, steps, techniquesUsed, grid };
    }

    // Try techniques in order of difficulty
    for (const { apply } of TECHNIQUES) {
      const step = apply(grid, candidates);
      if (step) {
        steps.push(step);
        techniquesUsed.add(step.technique);
        progress = true;
        break;
      }
    }
  }

  // Check if solved after loop
  let solved = true;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        solved = false;
        break;
      }
    }
    if (!solved) break;
  }

  return { solved, steps, techniquesUsed, grid };
}
