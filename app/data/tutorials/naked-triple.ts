import type { TutorialData } from "../bible-tutorials";

export const nakedTripleTutorial: TutorialData = {
  technique: "naked-triple",
  explanation: {
    what: "A Naked Triple occurs when three cells in a unit collectively contain exactly three candidates (though each cell need not have all three). The three values must fill those three cells, so they can be eliminated from all other cells in the unit.",
    when: "Look for three cells in a row, column, or box whose combined candidate set has exactly three values. Individual cells may have two or three of those values.",
    why: "If three cells can only hold values from a set of three, those three values are locked into those cells. No other cell in the unit can hold any of those three values.",
  },
  boardState: [
    0,7,0, 0,0,0, 0,0,0,
    0,0,0, 2,0,1, 0,0,0,
    0,4,0, 0,0,0, 0,0,0,

    0,0,0, 7,0,4, 8,0,0,
    0,0,0, 0,0,0, 0,0,0,
    0,0,9, 6,0,8, 7,0,0,

    0,0,0, 0,0,0, 0,6,0,
    0,0,0, 1,0,6, 0,0,0,
    0,0,0, 0,0,0, 0,2,0,
  ],
  candidates: {
    // Column 5 (indices 4, 13, 22, 31, 40, 49, 58, 67, 76)
    4:  [3, 6, 8, 9],
    13: [3, 6, 8],
    22: [1, 3, 6, 8, 9],
    31: [1, 2, 3],
    40: [1, 2, 3],
    49: [1, 2, 3],
    58: [3, 4, 8, 9],
    67: [2, 3, 8, 9],
    76: [3, 4, 8, 9],
  },
  steps: [
    {
      description: "Let's find a Naked Triple in column 5. All nine cells in this column are empty. We need to examine their candidates carefully.",
      highlightCells: [4, 13, 22, 31, 40, 49, 58, 67, 76],
    },
    {
      description: "Look at cells R4C5, R5C5, and R6C5. R4C5 has {1, 2, 3}, R5C5 has {1, 2, 3}, and R6C5 has {1, 2, 3}.",
      highlightCells: [31, 40, 49],
      highlightCandidates: [
        { cell: 31, values: [1, 2, 3] },
        { cell: 40, values: [1, 2, 3] },
        { cell: 49, values: [1, 2, 3] },
      ],
    },
    {
      description: "These three cells collectively contain only three distinct values: {1, 2, 3}. This is a Naked Triple! The digits 1, 2, and 3 must fill these three cells in some order.",
      highlightCells: [31, 40, 49],
      highlightCandidates: [
        { cell: 31, values: [1, 2, 3] },
        { cell: 40, values: [1, 2, 3] },
        { cell: 49, values: [1, 2, 3] },
      ],
    },
    {
      description: "Therefore, we can eliminate 1, 2, and 3 from all other cells in column 5. This removes 3 from R1C5, R2C5, R3C5, R7C5, R8C5, R9C5, and other overlapping candidates.",
      highlightCells: [31, 40, 49],
      eliminateCandidates: [
        { cell: 4, values: [3] },
        { cell: 13, values: [3] },
        { cell: 22, values: [1, 3] },
        { cell: 58, values: [3] },
        { cell: 67, values: [2, 3] },
        { cell: 76, values: [3] },
      ],
    },
  ],
};
