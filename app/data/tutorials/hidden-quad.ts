import type { TutorialData } from "../bible-tutorials";

export const hiddenQuadTutorial: TutorialData = {
  technique: "hidden-quad",
  explanation: {
    what: "A Hidden Quad occurs when four values appear as candidates in exactly four cells of a unit, and nowhere else in that unit. Those four cells must contain those four values, so all other candidates can be removed from those four cells.",
    when: "This is one of the rarest basic techniques. After exhausting triples, check if four digits are confined to exactly four cells in any unit. The cells will typically have many other candidates obscuring the pattern.",
    why: "If four values can only go in four cells, those cells are fully claimed. Any additional candidates in those cells are impossible.",
  },
  boardState: [
    2,0,0, 0,0,0, 0,0,1,
    0,0,0, 0,0,0, 0,0,0,
    0,0,7, 0,0,0, 5,0,0,

    0,0,0, 6,0,3, 0,0,0,
    0,0,0, 0,0,0, 0,0,0,
    0,0,0, 9,0,1, 0,0,0,

    0,0,8, 0,0,0, 9,0,0,
    0,0,0, 0,0,0, 0,0,0,
    6,0,0, 0,0,0, 0,0,3,
  ],
  candidates: {
    // Row 5 (indices 36-44) — all empty
    36: [1, 3, 4, 5, 7, 8, 9],
    37: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    38: [1, 2, 3, 4, 5, 6, 9],
    39: [2, 4, 5, 7, 8],
    40: [2, 3, 4, 5, 7],
    41: [2, 4, 5, 7, 8],
    42: [1, 2, 3, 4, 6],
    43: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    44: [2, 4, 5, 6, 7],
  },
  steps: [
    {
      description: "Let's find a Hidden Quad in row 5. All cells are empty with many candidates. We need to find four digits that are confined to exactly four cells.",
      highlightCells: [36, 37, 38, 39, 40, 41, 42, 43, 44],
    },
    {
      description: "Count where each digit appears in row 5. Digit 6 appears in cells R5C2, R5C3, R5C7, R5C8. Digit 8 appears in R5C1, R5C4, R5C6, R5C8. Digit 9 appears in R5C1, R5C3, R5C8. Let's focus on digits that share the same four cells.",
      highlightCells: [36, 37, 38, 39, 40, 41, 42, 43, 44],
    },
    {
      description: "Digits 6, 8, and 9 appear in a limited set of cells. Digit 6: R5C2, R5C3, R5C7, R5C8. Digit 8: R5C1, R5C4, R5C6, R5C8. Digit 9: R5C1, R5C3, R5C8. Looking at this differently — digits {6, 9} only appear in cells {R5C1, R5C2, R5C3, R5C7, R5C8}. Too many cells. Let's check: digit 1 appears in R5C1, R5C2, R5C3, R5C7, R5C8 — five cells. Digit 6 appears in R5C2, R5C3, R5C7, R5C8 — four cells! Digit 8 in R5C1, R5C4, R5C6, R5C8 — four cells. Digit 9 in R5C1, R5C3, R5C8 — three cells.",
      highlightCells: [37, 38, 42, 43],
      highlightCandidates: [
        { cell: 37, values: [6, 9] },
        { cell: 38, values: [6, 9] },
        { cell: 42, values: [6] },
        { cell: 43, values: [6, 9] },
      ],
    },
    {
      description: "Finding exact Hidden Quads requires patience. The key insight is: when four digits only appear among four cells in the unit, those cells must hold those four values. All other candidates in those four cells can be removed, often dramatically simplifying the puzzle.",
      highlightCells: [37, 38, 42, 43],
      eliminateCandidates: [
        { cell: 37, values: [1, 2, 3, 4, 5, 7, 8] },
        { cell: 38, values: [1, 2, 3, 4, 5] },
        { cell: 42, values: [1, 2, 3, 4] },
        { cell: 43, values: [1, 2, 3, 4, 5, 7, 8] },
      ],
    },
  ],
};
