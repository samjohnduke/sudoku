import type { TutorialData } from "../bible-tutorials";

export const hiddenSingleTutorial: TutorialData = {
  technique: "hidden-single",
  explanation: {
    what: "A Hidden Single occurs when a candidate appears in only one cell within a row, column, or box. Even if that cell has multiple candidates, the value must go there because no other cell in that unit can hold it.",
    when: "After checking for Naked Singles, scan each unit (row, column, box) and count how many cells can hold each digit. If a digit can only go in one cell of a unit, that is a Hidden Single.",
    why: "Every unit must contain each digit exactly once. If a digit has only one possible location in a unit, it must go there regardless of what other candidates that cell has.",
  },
  boardState: [
    0,0,0, 0,0,0, 0,1,0,
    4,0,0, 0,0,0, 0,0,0,
    0,2,0, 0,0,0, 0,0,0,

    0,0,0, 0,5,0, 4,0,7,
    0,0,8, 0,0,0, 3,0,0,
    0,0,1, 0,9,0, 0,0,0,

    3,0,0, 4,0,0, 2,0,0,
    0,5,0, 1,0,0, 0,0,0,
    0,0,0, 8,6,0, 0,0,0,
  ],
  candidates: {
    27: [2, 6, 9],
    28: [3, 6],
    29: [6, 9],
    30: [2, 3, 6, 7],
    32: [1, 2, 6, 8],
    34: [8, 9],
    // Row 4 (index 27-35): focus on column 1 (index 28)
  },
  steps: [
    {
      description: "Let's find a Hidden Single. Look at row 4 (cells R4C1 through R4C9). Several cells are empty with multiple candidates each.",
      highlightCells: [27, 28, 29, 30, 32, 34],
    },
    {
      description: "Cell R4C1 can hold 2, 6, or 9. Cell R4C2 can hold 3 or 6. Cell R4C3 can hold 6 or 9. Cell R4C4 can hold 2, 3, 6, or 7. Cell R4C6 can hold 1, 2, 6, or 8. Cell R4C8 can hold 8 or 9.",
      highlightCells: [27, 28, 29, 30, 32, 34],
      highlightCandidates: [
        { cell: 27, values: [2, 6, 9] },
        { cell: 28, values: [3, 6] },
        { cell: 29, values: [6, 9] },
        { cell: 30, values: [2, 3, 6, 7] },
        { cell: 32, values: [1, 2, 6, 8] },
        { cell: 34, values: [8, 9] },
      ],
    },
    {
      description: "Now look for digit 3 in this row. It can only appear in R4C2 (candidates 3, 6) and R4C4 (candidates 2, 3, 6, 7). But wait — check where 3 can go. Actually, focus on digit 7: it appears as a candidate only in R4C4.",
      highlightCells: [30],
      highlightCandidates: [{ cell: 30, values: [7] }],
    },
    {
      description: "Since 7 can only go in one cell in row 4, R4C4 must be 7. This is a Hidden Single — the 7 is 'hidden' among other candidates in that cell.",
      highlightCells: [30],
      placementCells: [{ cell: 30, value: 7 }],
    },
  ],
};
