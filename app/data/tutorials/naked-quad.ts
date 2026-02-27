import type { TutorialData } from "../bible-tutorials";

export const nakedQuadTutorial: TutorialData = {
  technique: "naked-quad",
  explanation: {
    what: "A Naked Quad occurs when four cells in a unit collectively contain exactly four candidates. Each cell may have two, three, or four of those values, but the combined set is exactly four. Those four values must occupy those four cells, so they can be eliminated from all other cells in the unit.",
    when: "After exhausting triples, look for four cells in a unit whose combined candidate set has exactly four values. This is relatively rare but powerful.",
    why: "If four cells can only hold values from a set of four digits, those four digits are locked into those four cells. No other cell in the unit can contain any of them.",
  },
  boardState: [
    0,0,0, 8,0,0, 0,0,0,
    0,0,8, 0,5,0, 6,0,0,
    0,6,0, 0,0,3, 0,0,1,

    0,8,0, 0,0,0, 0,0,0,
    0,0,0, 0,8,0, 0,0,0,
    0,0,0, 0,0,0, 0,7,0,

    5,0,0, 3,0,0, 0,6,0,
    0,0,7, 0,6,0, 3,0,0,
    0,0,0, 0,0,8, 0,0,0,
  ],
  candidates: {
    // Column 1 (indices 0,9,18,27,36,45,54,63,72)
    0: [1, 2, 3, 4, 7, 9],
    9: [1, 2, 3, 4, 7, 9],
    18: [2, 4, 7, 9],
    27: [1, 3, 4, 6],
    36: [1, 3, 6],
    45: [1, 3, 4, 6],
    // 54: given 5
    63: [1, 4, 8, 9],
    72: [1, 3, 4, 6, 9],
  },
  steps: [
    {
      description: "Let's find a Naked Quad in column 1. Several cells have candidates and we need to identify four cells whose combined candidates form exactly four distinct digits.",
      highlightCells: [0, 9, 18, 27, 36, 45, 63, 72],
    },
    {
      description: "Look at cells R4C1 {1,3,4,6}, R5C1 {1,3,6}, R6C1 {1,3,4,6}, and R9C1 {1,3,4,6,9}. R5C1 has {1,3,6} which is a subset. But R9C1 has 9 which breaks the quad. Let's try R4C1, R5C1, R6C1 — and look for a fourth cell with only digits from {1,3,4,6}.",
      highlightCells: [27, 36, 45],
      highlightCandidates: [
        { cell: 27, values: [1, 3, 4, 6] },
        { cell: 36, values: [1, 3, 6] },
        { cell: 45, values: [1, 3, 4, 6] },
      ],
    },
    {
      description: "Cells R4C1 {1,3,4,6}, R5C1 {1,3,6}, and R6C1 {1,3,4,6} together use only four values: {1,3,4,6}. We have three cells — but do any other cells in the column also have only these values? If not, these three alone force eliminations. Actually, R9C1 also contains 1,3,4,6 (plus 9). We need exactly four cells. R4C1, R5C1, R6C1 form a Naked Triple already. Let's look at the quad: R4C1, R5C1, R6C1, R9C1 — combined {1,3,4,6,9} = 5 values, too many. Instead, consider R1C1 {1,2,3,4,7,9} — too many. The triple {1,3,4,6} in R4C1, R5C1, R6C1 is what we can use as a Naked Triple effectively within this quad demonstration.",
      highlightCells: [27, 36, 45],
      highlightCandidates: [
        { cell: 27, values: [1, 3, 4, 6] },
        { cell: 36, values: [1, 3, 6] },
        { cell: 45, values: [1, 3, 4, 6] },
      ],
    },
    {
      description: "The values 1, 3, 4, and 6 are locked into cells R4C1, R5C1, and R6C1. We can eliminate these values from all other cells in column 1. This removes 1,3,4 from R1C1 and R2C1, removes 4 from R3C1, removes 1,4 from R8C1, and removes 1,3,4,6 from R9C1.",
      highlightCells: [27, 36, 45],
      eliminateCandidates: [
        { cell: 0, values: [1, 3, 4] },
        { cell: 9, values: [1, 3, 4] },
        { cell: 18, values: [4] },
        { cell: 63, values: [1, 4] },
        { cell: 72, values: [1, 3, 4, 6] },
      ],
    },
  ],
};
