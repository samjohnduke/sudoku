import type { TutorialData } from "../bible-tutorials";

export const hiddenTripleTutorial: TutorialData = {
  technique: "hidden-triple",
  explanation: {
    what: "A Hidden Triple occurs when three values appear as candidates in exactly three cells of a unit (and nowhere else in that unit). Those three cells must contain those three values, so all other candidates can be removed from those cells.",
    when: "After checking for pairs, look for three digits that are each confined to the same three cells in a unit. This is rarer than Hidden Pairs but follows the same logic.",
    why: "If three values can only go in three cells of a unit, those cells are fully occupied by those values. Any additional candidates in those cells are impossible.",
  },
  boardState: [
    0,0,0, 0,1,0, 0,0,0,
    0,5,0, 0,0,0, 0,3,0,
    0,0,9, 0,0,0, 1,0,0,

    0,0,0, 8,0,3, 0,0,0,
    1,0,0, 0,0,0, 0,0,6,
    0,0,0, 7,0,9, 0,0,0,

    0,0,4, 0,0,0, 8,0,0,
    0,8,0, 0,0,0, 0,7,0,
    0,0,0, 0,6,0, 0,0,0,
  ],
  candidates: {
    // Box 5 (center box, indices 30,31,32,39,40,41,48,49,50)
    // Row 4: 30=8, 31=empty, 32=3
    // Row 5: 39=empty, 40=empty, 41=empty
    // Row 6: 48=7, 49=empty, 50=9
    31: [1, 2, 4, 5, 6],
    39: [2, 4, 5, 6, 9],
    40: [2, 3, 4, 5],
    41: [2, 4, 5],
    49: [1, 2, 4, 5],
  },
  steps: [
    {
      description: "Let's look for a Hidden Triple in box 5 (the center box). Three cells are given (8, 3, 7, 9) and five cells are empty.",
      highlightCells: [31, 39, 40, 41, 49],
    },
    {
      description: "Examine where each digit can go in box 5. Digit 1 can go in R4C5 and R6C5. Digit 6 can go in R4C5 and R5C4. Digit 3 can go in R5C5 only. Let's focus on digits 1, 3, and 6.",
      highlightCells: [31, 39, 40],
      highlightCandidates: [
        { cell: 31, values: [1, 6] },
        { cell: 39, values: [6] },
        { cell: 40, values: [3] },
      ],
    },
    {
      description: "Digits 1, 3, and 6 appear only in cells R4C5 {1,2,4,5,6}, R5C4 {2,4,5,6,9}, and R5C5 {2,3,4,5}. These three digits are confined to three cells — a Hidden Triple!",
      highlightCells: [31, 39, 40],
      highlightCandidates: [
        { cell: 31, values: [1, 6] },
        { cell: 39, values: [6] },
        { cell: 40, values: [3] },
      ],
    },
    {
      description: "Since 1, 3, and 6 must occupy R4C5, R5C4, and R5C5, we can eliminate all other candidates from those cells. R4C5 becomes {1,6}, R5C4 becomes {6}, R5C5 becomes {3}.",
      highlightCells: [31, 39, 40],
      highlightCandidates: [
        { cell: 31, values: [1, 6] },
        { cell: 39, values: [6] },
        { cell: 40, values: [3] },
      ],
      eliminateCandidates: [
        { cell: 31, values: [2, 4, 5] },
        { cell: 39, values: [2, 4, 5, 9] },
        { cell: 40, values: [2, 4, 5] },
      ],
    },
  ],
};
