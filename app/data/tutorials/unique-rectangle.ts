import type { TutorialData } from "../bible-tutorials";

export const uniqueRectangleTutorial: TutorialData = {
  technique: "unique-rectangle",
  explanation: {
    what: "A Unique Rectangle exploits the fact that a valid sudoku has exactly one solution. If four cells form a rectangle across two boxes, with the same two candidates, it would create a 'deadly pattern' — two interchangeable solutions. To prevent this, extra candidates in one corner must be correct.",
    when: "Look for four cells forming a rectangle (two rows, two columns, spanning two boxes) where three cells have exactly the same two candidates. The fourth cell has those two candidates plus extras. The extra candidates in the fourth cell must include the true value.",
    why: "If all four cells had only {A,B}, you could swap the diagonals and still have a valid sudoku, violating uniqueness. Therefore, the cell with extra candidates cannot be just {A,B} — one of the extra values must be placed there.",
  },
  boardState: [
    0,0,5, 0,0,0, 0,0,0,
    0,0,0, 3,0,0, 0,0,0,
    0,7,0, 0,0,4, 0,0,6,

    0,0,0, 0,0,7, 0,4,0,
    5,0,0, 0,3,0, 0,0,8,
    0,4,0, 8,0,0, 0,0,0,

    3,0,0, 7,0,0, 0,2,0,
    0,0,0, 0,0,3, 0,0,0,
    0,0,0, 0,0,0, 4,0,0,
  ],
  candidates: {
    // Unique Rectangle Type 1:
    // Four cells forming a rectangle: R1C1, R1C4, R3C1, R3C4
    // Three corners have exactly {1,9}, fourth has {1,6,9}
    0: [1, 9],
    3: [1, 9],
    18: [1, 9],
    21: [1, 6, 9],
  },
  steps: [
    {
      description: "Let's identify a Unique Rectangle. We look for four cells forming a rectangle across two boxes where candidates create a 'deadly pattern.'",
      highlightCells: [0, 3, 18, 21],
    },
    {
      description: "R1C1 has {1,9}, R1C4 has {1,9}, and R3C1 has {1,9}. These three cells each contain exactly the same two candidates. R3C4 has {1,6,9} — the same pair plus digit 6.",
      highlightCells: [0, 3, 18, 21],
      highlightCandidates: [
        { cell: 0, values: [1, 9] },
        { cell: 3, values: [1, 9] },
        { cell: 18, values: [1, 9] },
        { cell: 21, values: [1, 6, 9] },
      ],
    },
    {
      description: "If R3C4 were also just {1,9}, we would have a deadly pattern: the digits 1 and 9 could be swapped in the rectangle without affecting the rest of the puzzle, creating two solutions. Since a valid sudoku has exactly one solution, this cannot happen.",
      highlightCells: [0, 3, 18, 21],
      highlightCandidates: [
        { cell: 0, values: [1, 9] },
        { cell: 3, values: [1, 9] },
        { cell: 18, values: [1, 9] },
        { cell: 21, values: [1, 9] },
      ],
    },
    {
      description: "Therefore, R3C4 cannot be 1 or 9 (as that would complete the deadly pattern). The extra candidate 6 must be the correct value. We can eliminate 1 and 9 from R3C4, leaving only 6.",
      highlightCells: [21],
      eliminateCandidates: [{ cell: 21, values: [1, 9] }],
      placementCells: [{ cell: 21, value: 6 }],
    },
  ],
};
