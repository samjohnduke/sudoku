import type { TutorialData } from "../bible-tutorials";

export const xWingTutorial: TutorialData = {
  technique: "x-wing",
  explanation: {
    what: "An X-Wing occurs when a candidate appears in exactly two cells in each of two different rows, and those cells share the same two columns. The candidate must be in one of two diagonal arrangements, so it can be eliminated from all other cells in those two columns.",
    when: "For each candidate value, look at rows where that value appears in exactly two cells. If two such rows share the same two columns, you have an X-Wing.",
    why: "The candidate must appear once in each row. With only two positions per row, and those positions aligned in columns, the value must fill one diagonal of the rectangle. Either way, the two columns are accounted for, so the candidate can be removed from other cells in those columns.",
  },
  boardState: [
    0,0,0, 0,2,0, 0,0,0,
    0,0,1, 7,0,5, 9,0,0,
    0,7,0, 0,0,0, 0,5,0,

    0,9,0, 5,0,1, 0,4,0,
    2,0,0, 0,0,0, 0,0,8,
    0,4,0, 8,0,2, 0,9,0,

    0,2,0, 0,0,0, 0,8,0,
    0,0,4, 2,0,8, 5,0,0,
    0,0,0, 0,5,0, 0,0,0,
  ],
  candidates: {
    // Focus on digit 3
    // Row 1 (idx 0-8): 3 can go in col 1(idx 0), col 4(idx 3), col 6(idx 5), col 9(idx 8)
    // Row 3 (idx 18-26): 3 can go in col 1(idx 18), col 3(idx 20), col 7(idx 24)
    // Row 7 (idx 54-62): 3 can go in col 1(idx 54), col 3(idx 56)
    // Row 9 (idx 72-80): 3 can go in col 1(idx 72), col 3(idx 74)
    // X-Wing: rows 7,9 both have 3 only in cols 1,3 → eliminate 3 from cols 1,3 in other rows
    54: [1, 3, 6, 7],
    56: [3, 6],
    72: [1, 3, 6, 7, 8, 9],
    74: [1, 3, 6, 9],
    // Other cells in col 1 and col 3 with digit 3:
    0: [1, 3, 4, 5, 6, 8],
    18: [1, 3, 4, 6, 8],
    36: [1, 3, 5, 6, 7],
    20: [3, 6, 8],
  },
  steps: [
    {
      description: "Let's find an X-Wing. We will focus on digit 3. First, we identify rows where 3 can go in exactly two cells.",
      highlightCells: [54, 56, 72, 74],
    },
    {
      description: "In row 7, digit 3 can only go in R7C1 and R7C3. In row 9, digit 3 can also only go in R9C1 and R9C3. These two rows share the same two columns (1 and 3).",
      highlightCells: [54, 56, 72, 74],
      highlightCandidates: [
        { cell: 54, values: [3] },
        { cell: 56, values: [3] },
        { cell: 72, values: [3] },
        { cell: 74, values: [3] },
      ],
    },
    {
      description: "This forms an X-Wing rectangle. The digit 3 must go in either {R7C1, R9C3} or {R7C3, R9C1}. Either way, columns 1 and 3 each get a 3 from these rows.",
      highlightCells: [54, 56, 72, 74],
      highlightCandidates: [
        { cell: 54, values: [3] },
        { cell: 56, values: [3] },
        { cell: 72, values: [3] },
        { cell: 74, values: [3] },
      ],
    },
    {
      description: "Therefore, we can eliminate 3 from all other cells in columns 1 and 3 (outside the X-Wing rows). This removes 3 from R1C1, R3C1, R5C1, and R3C3.",
      highlightCells: [54, 56, 72, 74],
      eliminateCandidates: [
        { cell: 0, values: [3] },
        { cell: 18, values: [3] },
        { cell: 36, values: [3] },
        { cell: 20, values: [3] },
      ],
    },
  ],
};
