import type { TutorialData } from "../bible-tutorials";

export const jellyfishTutorial: TutorialData = {
  technique: "jellyfish",
  explanation: {
    what: "A Jellyfish is the 4-row extension of X-Wing and Swordfish. A candidate appears in at most four positions in each of four rows, and all positions fall within exactly four columns. The candidate can be eliminated from all other cells in those four columns.",
    when: "After X-Wings and Swordfish, look for four rows where a candidate is restricted to the same four columns. Each row may have the candidate in two, three, or four of those columns.",
    why: "Each of the four rows must place the candidate once, and all placements fall in four columns. Since four placements fill four columns, no other cell in those columns can hold the candidate.",
  },
  boardState: [
    0,0,0, 0,0,0, 0,0,0,
    0,3,0, 0,7,0, 0,6,0,
    0,0,0, 0,0,0, 0,0,0,

    0,0,0, 8,0,3, 0,0,0,
    0,7,0, 0,0,0, 0,2,0,
    0,0,0, 6,0,9, 0,0,0,

    0,0,0, 0,0,0, 0,0,0,
    0,6,0, 0,2,0, 0,3,0,
    0,0,0, 0,0,0, 0,0,0,
  ],
  candidates: {
    // Digit 5 — Jellyfish in rows 1,3,7,9 across columns 1,3,7,9
    // Row 1 indices: 0,2,6,8
    // Row 3 indices: 18,20,24,26
    // Row 7 indices: 54,56,60,62
    // Row 9 indices: 72,74,78,80
    0: [1, 2, 4, 5, 8, 9],
    2: [1, 2, 4, 5, 6, 8, 9],
    6: [1, 3, 4, 5, 9],
    8: [1, 4, 5, 7, 8, 9],
    18: [1, 2, 4, 5, 8, 9],
    20: [1, 2, 4, 5, 6],
    24: [1, 3, 4, 5],
    26: [1, 4, 5, 7, 8],
    54: [1, 2, 4, 5, 8, 9],
    56: [1, 2, 4, 5],
    60: [1, 4, 5, 8],
    62: [1, 4, 5, 7],
    72: [1, 2, 3, 4, 5, 7, 8, 9],
    74: [1, 2, 3, 4, 5, 7],
    78: [1, 4, 5, 7, 8],
    80: [1, 2, 4, 5, 7],
    // Other cells in those columns with digit 5 to eliminate from
    27: [1, 2, 4, 5],
    29: [1, 2, 4, 5, 7],
    33: [1, 4, 5, 7],
    35: [1, 4, 5, 7],
    45: [1, 2, 3, 4, 5, 7],
    47: [1, 2, 3, 4, 5, 7],
    51: [1, 4, 5, 7, 8],
    53: [1, 2, 4, 5, 7],
  },
  steps: [
    {
      description: "Let's find a Jellyfish — a 4-row fish pattern. We focus on digit 5. We look for four rows where 5 appears in positions spanning exactly four columns.",
      highlightCells: [0, 2, 6, 8, 18, 20, 24, 26, 54, 56, 60, 62, 72, 74, 78, 80],
    },
    {
      description: "In rows 1, 3, 7, and 9, digit 5 appears only in columns 1, 3, 7, and 9. Each row has up to four possible positions for 5, and they all fall within these four columns.",
      highlightCells: [0, 2, 6, 8, 18, 20, 24, 26, 54, 56, 60, 62, 72, 74, 78, 80],
      highlightCandidates: [
        { cell: 0, values: [5] }, { cell: 2, values: [5] }, { cell: 6, values: [5] }, { cell: 8, values: [5] },
        { cell: 18, values: [5] }, { cell: 20, values: [5] }, { cell: 24, values: [5] }, { cell: 26, values: [5] },
        { cell: 54, values: [5] }, { cell: 56, values: [5] }, { cell: 60, values: [5] }, { cell: 62, values: [5] },
        { cell: 72, values: [5] }, { cell: 74, values: [5] }, { cell: 78, values: [5] }, { cell: 80, values: [5] },
      ],
    },
    {
      description: "This is a Jellyfish! Four rows each placing digit 5 within the same four columns. The four placements will fill all four columns.",
      highlightCells: [0, 2, 6, 8, 18, 20, 24, 26, 54, 56, 60, 62, 72, 74, 78, 80],
    },
    {
      description: "We can eliminate 5 from all other cells in columns 1, 3, 7, and 9 outside of rows 1, 3, 7, and 9. This removes 5 from rows 4, 5, 6, and any other affected rows in those columns.",
      highlightCells: [0, 2, 6, 8, 18, 20, 24, 26, 54, 56, 60, 62, 72, 74, 78, 80],
      eliminateCandidates: [
        { cell: 27, values: [5] }, { cell: 29, values: [5] },
        { cell: 33, values: [5] }, { cell: 35, values: [5] },
        { cell: 45, values: [5] }, { cell: 47, values: [5] },
        { cell: 51, values: [5] }, { cell: 53, values: [5] },
      ],
    },
  ],
};
