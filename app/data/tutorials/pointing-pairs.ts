import type { TutorialData } from "../bible-tutorials";

export const pointingPairsTutorial: TutorialData = {
  technique: "pointing-pairs",
  explanation: {
    what: "A Pointing Pair (or Triple) occurs when a candidate within a box is restricted to a single row or column. Since the value must appear in that box, and it can only be in cells along that row or column, it can be eliminated from other cells in the same row or column outside the box.",
    when: "For each box, check each candidate. If a candidate only appears in cells that share a row (or column), it is 'pointing' along that line, and you can eliminate it from the rest of that line.",
    why: "The box must contain that digit, and it can only go in cells along one line. Therefore, that line's portion inside the box is claimed, and the digit cannot appear elsewhere on the same line.",
  },
  boardState: [
    0,0,3, 0,0,0, 0,0,0,
    0,0,6, 0,0,0, 0,0,0,
    0,0,0, 5,8,0, 0,0,0,

    0,4,0, 0,0,0, 8,0,0,
    0,8,0, 0,0,0, 3,0,0,
    7,0,2, 0,0,0, 0,6,0,

    0,6,0, 0,0,0, 7,0,0,
    0,0,9, 0,0,0, 0,0,0,
    1,0,0, 0,0,0, 0,0,6,
  ],
  candidates: {
    // Box 1 (top-left): indices 0,1,2,9,10,11,18,19,20
    0: [2, 4, 5, 8, 9],
    1: [2, 5, 7, 9],
    // 2: given 3
    9: [2, 4, 5, 8, 9],
    10: [1, 2, 5, 7, 9],
    // 11: given 6
    18: [2, 4, 9],
    19: [1, 2, 7, 9],
    20: [1, 4, 7],
    // Focus: digit 8 in box 1 — only in R1C1 and R2C1 (column 1)
    // So 8 can be eliminated from rest of column 1
  },
  steps: [
    {
      description: "Let's look for a Pointing Pair. Examine box 1 (top-left 3x3). We want to find a candidate that is restricted to a single row or column within this box.",
      highlightCells: [0, 1, 9, 10, 18, 19, 20],
    },
    {
      description: "Look at where digit 8 can go in box 1. R1C1 has {2,4,5,8,9} and R2C1 has {2,4,5,8,9}. These are the only two cells in box 1 that can hold 8, and they are both in column 1.",
      highlightCells: [0, 9],
      highlightCandidates: [
        { cell: 0, values: [8] },
        { cell: 9, values: [8] },
      ],
    },
    {
      description: "Since 8 must go somewhere in box 1, and it can only go in column 1 within that box, the 8 in column 1 is locked to box 1. This is a Pointing Pair!",
      highlightCells: [0, 9],
      highlightCandidates: [
        { cell: 0, values: [8] },
        { cell: 9, values: [8] },
      ],
    },
    {
      description: "We can now eliminate 8 from all other cells in column 1 outside of box 1. This means removing 8 as a candidate from any cells in rows 4-9, column 1.",
      highlightCells: [0, 9],
      eliminateCells: [27, 36, 45, 54, 63, 72],
    },
  ],
};
