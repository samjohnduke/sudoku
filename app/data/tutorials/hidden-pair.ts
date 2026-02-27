import type { TutorialData } from "../bible-tutorials";

export const hiddenPairTutorial: TutorialData = {
  technique: "hidden-pair",
  explanation: {
    what: "A Hidden Pair occurs when two values appear as candidates in exactly two cells of a unit, and nowhere else in that unit. Those two cells must contain those two values, so all other candidates can be removed from those cells.",
    when: "For each unit, count how many cells contain each candidate value. If two values each appear in exactly the same two cells, you have a Hidden Pair.",
    why: "Since those two values can only go in those two cells, the cells are fully determined by them. Any other candidates in those cells are impossible and can be eliminated.",
  },
  boardState: [
    9,0,0, 3,0,0, 0,4,0,
    0,0,0, 0,0,0, 0,0,8,
    0,0,0, 0,0,0, 3,0,6,

    0,5,0, 7,0,8, 0,0,4,
    0,0,0, 0,0,0, 0,0,0,
    8,0,0, 4,0,2, 0,5,0,

    4,0,6, 0,0,0, 0,0,0,
    2,0,0, 0,0,0, 0,0,0,
    0,3,0, 0,0,4, 0,0,0,
  ],
  candidates: {
    // Row 5 (indices 36-44)
    36: [1, 3, 6],
    37: [1, 2, 4, 6, 7],
    38: [1, 2, 3, 7],
    39: [1, 5, 6, 9],
    40: [1, 3, 5, 6, 9],
    41: [1, 5, 6, 9],
    42: [1, 2, 6, 9],
    43: [1, 2, 3, 6, 7, 9],
    44: [1, 2, 3, 7, 9],
  },
  steps: [
    {
      description: "Let's find a Hidden Pair in row 5. Every cell in this row is empty, and each has multiple candidates.",
      highlightCells: [36, 37, 38, 39, 40, 41, 42, 43, 44],
    },
    {
      description: "Count where each digit appears in row 5. Digit 4 appears only in R5C2. Digit 5 appears in R5C4, R5C5, R5C6. Now look at digits that appear in exactly two cells.",
      highlightCells: [36, 37, 38, 39, 40, 41, 42, 43, 44],
      highlightCandidates: [
        { cell: 37, values: [4] },
        { cell: 39, values: [5] },
        { cell: 40, values: [5] },
        { cell: 41, values: [5] },
      ],
    },
    {
      description: "Focus on digits 4 and 7. Digit 4 appears only in R5C2 {1,2,4,6,7}. Digit 7 appears only in R5C2 and R5C3 {1,2,3,7}. Wait — let's check more carefully. Digits 4 and 7 both appear only in cells R5C2 and R5C3. This is a Hidden Pair!",
      highlightCells: [37, 38],
      highlightCandidates: [
        { cell: 37, values: [4, 7] },
        { cell: 38, values: [7] },
      ],
    },
    {
      description: "Since 4 and 7 must go in R5C2 and R5C3, all other candidates in those cells can be eliminated. R5C2 reduces from {1,2,4,6,7} to {4,7}. R5C3 reduces from {1,2,3,7} to {4,7}.",
      highlightCells: [37, 38],
      highlightCandidates: [
        { cell: 37, values: [4, 7] },
        { cell: 38, values: [4, 7] },
      ],
      eliminateCandidates: [
        { cell: 37, values: [1, 2, 6] },
        { cell: 38, values: [1, 2, 3] },
      ],
    },
  ],
};
