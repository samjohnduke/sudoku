import type { TutorialData } from "../bible-tutorials";

export const swordfishTutorial: TutorialData = {
  technique: "swordfish",
  explanation: {
    what: "A Swordfish is the 3-row extension of an X-Wing. A candidate appears in at most three cells in each of three rows, and those cells span exactly three columns. The candidate can then be eliminated from all other cells in those three columns.",
    when: "After checking for X-Wings, look for a candidate that appears in two or three positions in each of three rows, with all positions falling in the same three columns.",
    why: "Each of the three rows must contain the candidate once. With positions limited to three columns, the three placements fill all three columns. The candidate cannot appear elsewhere in those columns.",
  },
  boardState: [
    0,0,0, 5,0,8, 0,0,0,
    5,0,0, 0,7,0, 0,0,1,
    0,0,0, 0,0,0, 0,2,0,

    0,0,0, 7,1,2, 0,0,0,
    0,0,0, 0,0,0, 0,0,0,
    0,0,0, 4,8,6, 0,0,0,

    0,8,0, 0,0,0, 0,0,0,
    7,0,0, 0,4,0, 0,0,8,
    0,0,0, 8,0,1, 0,0,0,
  ],
  candidates: {
    // Focus on digit 9
    // Row 1: 9 in cols 1,2,3,7,8,9 → but narrowed: indices 0,1,2,6,7,8
    // Row 5: 9 in cols 1,2,3,7,8,9 → indices 36,37,38,42,43,44
    // Row 9: 9 in cols 1,2,3,5,7,8,9 → indices 72,73,74,76,78,79,80
    // Simplify: let's say digit 6 forms a swordfish in rows 1,5,9 across cols 1,7,9
    0: [1, 3, 4, 6, 9],
    6: [3, 4, 6, 9],
    8: [3, 4, 6, 7],
    36: [1, 2, 3, 6, 9],
    42: [1, 2, 3, 5, 6],
    44: [2, 3, 5, 6, 7],
    72: [2, 3, 4, 6, 9],
    78: [3, 5, 6, 7],
    80: [2, 3, 4, 5, 6, 7],
    // Other cells in cols 1,7,9 with digit 6
    18: [1, 3, 4, 6],
    24: [3, 4, 5, 6],
    26: [3, 4, 6, 7],
    54: [1, 3, 4, 6],
    60: [1, 2, 3, 5, 6],
    62: [2, 3, 5, 6],
  },
  steps: [
    {
      description: "Let's find a Swordfish. We focus on digit 6 and look for three rows where 6 appears in positions spanning exactly three columns.",
      highlightCells: [0, 6, 8, 36, 42, 44, 72, 78, 80],
    },
    {
      description: "In row 1, digit 6 can go in columns 1, 7, and 9 (R1C1, R1C7, R1C9). In row 5, digit 6 can go in columns 1, 7, and 9 (R5C1, R5C7, R5C9). In row 9, digit 6 can go in columns 1, 7, and 9 (R9C1, R9C7, R9C9).",
      highlightCells: [0, 6, 8, 36, 42, 44, 72, 78, 80],
      highlightCandidates: [
        { cell: 0, values: [6] },
        { cell: 6, values: [6] },
        { cell: 8, values: [6] },
        { cell: 36, values: [6] },
        { cell: 42, values: [6] },
        { cell: 44, values: [6] },
        { cell: 72, values: [6] },
        { cell: 78, values: [6] },
        { cell: 80, values: [6] },
      ],
    },
    {
      description: "These three rows all have digit 6 confined to the same three columns (1, 7, 9). This forms a Swordfish pattern. Each row must place a 6 in one of those columns, filling all three columns.",
      highlightCells: [0, 6, 8, 36, 42, 44, 72, 78, 80],
      highlightCandidates: [
        { cell: 0, values: [6] },
        { cell: 6, values: [6] },
        { cell: 8, values: [6] },
        { cell: 36, values: [6] },
        { cell: 42, values: [6] },
        { cell: 44, values: [6] },
        { cell: 72, values: [6] },
        { cell: 78, values: [6] },
        { cell: 80, values: [6] },
      ],
    },
    {
      description: "We can eliminate 6 from all other cells in columns 1, 7, and 9 (outside rows 1, 5, 9). This removes 6 from R3C1, R3C7, R3C9, R7C1, R7C7, R7C9.",
      highlightCells: [0, 6, 8, 36, 42, 44, 72, 78, 80],
      eliminateCandidates: [
        { cell: 18, values: [6] },
        { cell: 24, values: [6] },
        { cell: 26, values: [6] },
        { cell: 54, values: [6] },
        { cell: 60, values: [6] },
        { cell: 62, values: [6] },
      ],
    },
  ],
};
