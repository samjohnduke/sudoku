import type { TutorialData } from "../bible-tutorials";

export const boxLineReductionTutorial: TutorialData = {
  technique: "box-line-reduction",
  explanation: {
    what: "Box/Line Reduction is the reverse of Pointing Pairs. When a candidate in a row or column is confined to a single box, it can be eliminated from all other cells in that box (outside the row or column).",
    when: "For each row or column, check each candidate. If a candidate only appears in cells that belong to the same box, it can be eliminated from other cells in that box.",
    why: "The row or column must contain that digit, and it can only place it within one box. Therefore, that digit is locked to the intersection, and other cells in the box cannot hold it.",
  },
  boardState: [
    0,0,0, 9,0,0, 0,0,0,
    0,0,0, 0,1,0, 0,0,0,
    0,0,0, 0,0,7, 0,0,5,

    0,3,0, 0,0,1, 0,0,0,
    0,0,0, 3,0,0, 0,5,0,
    0,7,0, 0,0,4, 0,0,0,

    2,0,0, 0,0,0, 0,0,0,
    0,0,0, 0,8,0, 0,0,0,
    0,0,5, 4,0,0, 0,0,0,
  ],
  candidates: {
    // Row 1: focus on digit 5 in row 1
    // Row 1 indices: 0,1,2,3,4,5,6,7,8
    0: [1, 4, 5, 6, 8],
    1: [1, 2, 4, 5, 6, 8],
    2: [1, 4, 6, 8],
    // 3: given 9
    4: [2, 3, 4, 5, 6],
    5: [2, 3, 5, 6, 8],
    6: [1, 3, 4, 6, 8],
    7: [1, 2, 3, 4, 6],
    8: [1, 3, 4, 6, 8],
    // Digit 5 in row 1 appears in cells 0, 1, 4, 5
    // Cells 0,1 are in box 1; cells 4,5 are in box 2
    // If 5 in row 1 is restricted to box 1 (cells 0,1), eliminate from rest of box 1
  },
  steps: [
    {
      description: "Let's look for a Box/Line Reduction. Examine row 1 and see where digit 5 can go.",
      highlightCells: [0, 1, 2, 4, 5, 6, 7, 8],
    },
    {
      description: "In row 1, digit 5 can go in R1C1 {1,4,5,6,8} and R1C2 {1,2,4,5,6,8}. Those cells with 5 as a candidate are only in columns 1 and 2.",
      highlightCells: [0, 1],
      highlightCandidates: [
        { cell: 0, values: [5] },
        { cell: 1, values: [5] },
      ],
    },
    {
      description: "Both cells R1C1 and R1C2 belong to box 1. Since digit 5 in row 1 is confined to box 1, the 5 for row 1 must be placed in box 1. This is a Box/Line Reduction!",
      highlightCells: [0, 1],
      highlightCandidates: [
        { cell: 0, values: [5] },
        { cell: 1, values: [5] },
      ],
    },
    {
      description: "We can eliminate 5 from all other cells in box 1 that are not in row 1. This removes 5 from any cells in rows 2-3 of the first three columns.",
      highlightCells: [0, 1],
      eliminateCells: [9, 10, 11, 18, 19, 20],
    },
  ],
};
