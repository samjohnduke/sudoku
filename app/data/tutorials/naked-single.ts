import type { TutorialData } from "../bible-tutorials";

export const nakedSingleTutorial: TutorialData = {
  technique: "naked-single",
  explanation: {
    what: "A Naked Single occurs when a cell has only one possible candidate remaining. After eliminating all values that already appear in the cell's row, column, and box, only one number can go in that cell.",
    when: "This is the very first technique to look for. Scan each empty cell and count its candidates. If only one remains, you have found a Naked Single.",
    why: "Each cell must contain exactly one of the digits 1 through 9. If eight of those nine values already appear among the cell's peers (its row, column, and box), only one value remains possible.",
  },
  boardState: [
    5,3,0, 0,7,0, 0,0,0,
    6,0,0, 1,9,5, 0,0,0,
    0,9,8, 0,0,0, 0,6,0,

    8,0,0, 0,6,0, 0,0,3,
    4,0,0, 8,0,3, 0,0,1,
    7,0,0, 0,2,0, 0,0,6,

    0,6,0, 0,0,0, 2,8,0,
    0,0,0, 4,1,9, 0,0,5,
    0,0,0, 0,8,0, 0,7,9,
  ],
  candidates: {
    2: [1, 2, 4],
    10: [2, 4, 7],
    11: [2, 4, 7],
    19: [1, 2],
    20: [3, 4],
    21: [2, 3, 4, 6],
    24: [4],
  },
  steps: [
    {
      description: "Let's find a Naked Single. Look at cell R3C7 (row 3, column 7) — the seventh cell in the third row.",
      highlightCells: [24],
    },
    {
      description: "Row 3 already contains 9, 8, and 6. Column 7 contains 2. Box 3 (top-right) contains 6. Together with values from the row, column, and box, we can eliminate 1, 2, 3, 5, 6, 7, 8, and 9.",
      highlightCells: [24],
      highlightCandidates: [{ cell: 24, values: [4] }],
    },
    {
      description: "Only one candidate remains: 4. This is a Naked Single — the cell must be 4.",
      highlightCells: [24],
      placementCells: [{ cell: 24, value: 4 }],
    },
    {
      description: "Whenever a cell has exactly one candidate left, you can fill it in immediately. After placing a value, re-check neighboring cells — new Naked Singles often appear as a chain reaction.",
      highlightCells: [24],
    },
  ],
};
