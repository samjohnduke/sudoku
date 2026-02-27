import type { TutorialData } from "../bible-tutorials";

export const simpleColoringTutorial: TutorialData = {
  technique: "simple-coloring",
  explanation: {
    what: "Simple Coloring uses conjugate pairs (two cells in a unit that are the only places for a digit) to build alternating chains. By coloring these chains with two colors, if a cell sees two cells of the same color, that color is invalid. If a cell sees both colors, the digit can be eliminated from that cell.",
    when: "Find a digit that has conjugate pairs (exactly two positions in a unit). Link conjugate pairs into a chain and color them alternately. Look for contradictions or eliminations.",
    why: "In a conjugate pair, exactly one cell has the digit. Coloring alternates: if cell A is colored blue, its conjugate partner is green, and so on. If two cells of the same color see each other, that color is impossible. Any uncolored cell seeing both colors cannot hold the digit.",
  },
  boardState: [
    0,0,3, 0,0,0, 8,0,0,
    0,4,0, 0,8,0, 0,6,0,
    8,0,0, 0,0,3, 0,0,7,

    0,0,0, 5,0,0, 0,0,0,
    0,8,0, 0,0,0, 0,4,0,
    0,0,0, 0,0,7, 0,0,0,

    4,0,0, 8,0,0, 0,0,6,
    0,3,0, 0,7,0, 0,1,0,
    0,0,7, 0,0,0, 3,0,0,
  ],
  candidates: {
    // Focus on digit 1
    // Conjugate pairs for digit 1:
    // Row 1: 1 can go in R1C4(3) and R1C8(7) → conjugate pair
    // Col 4: 1 can go in R1C4(3) and R4C4(30)... etc
    // Build a chain:
    // R1C4 — R1C8 (row 1 conjugate)
    // R1C8 — R5C8 (col 8 conjugate? if so)
    3: [1, 2, 6],
    7: [2, 5, 9],
    30: [1, 2, 3, 6],
    43: [1, 2, 3, 5],
    // Simplified for tutorial
    0: [1, 2, 5, 6, 9],
    1: [1, 2, 5, 6, 7, 9],
    8: [1, 2, 5],
  },
  steps: [
    {
      description: "Simple Coloring builds a chain of conjugate pairs for a single digit. Let's trace digit 1. First, find conjugate pairs — units where 1 appears in exactly two cells.",
      highlightCells: [3, 7],
    },
    {
      description: "In row 1, digit 1 can only go in R1C4 and R1C8. This is a conjugate pair. We color R1C4 'blue' and R1C8 'green'. Exactly one of them is 1.",
      highlightCells: [3, 7],
      highlightCandidates: [
        { cell: 3, values: [1] },
        { cell: 7, values: [1] },
      ],
    },
    {
      description: "Now extend the chain. If R1C4 is blue, look for another conjugate pair involving R1C4. In column 4, if 1 appears in exactly R1C4 and R4C4, then R4C4 gets the opposite color (green). Continue linking pairs.",
      highlightCells: [3, 7, 30],
      highlightCandidates: [
        { cell: 3, values: [1] },
        { cell: 7, values: [1] },
        { cell: 30, values: [1] },
      ],
    },
    {
      description: "The key insight: any uncolored cell that sees both a blue and a green cell cannot be 1, because one of those colors must be correct. Alternatively, if two cells of the same color see each other, that entire color group is impossible, and the other color is correct.",
      highlightCells: [3, 7, 30],
      eliminateCandidates: [
        { cell: 0, values: [1] },
        { cell: 1, values: [1] },
      ],
    },
  ],
};
