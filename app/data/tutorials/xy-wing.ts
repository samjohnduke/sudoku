import type { TutorialData } from "../bible-tutorials";

export const xyWingTutorial: TutorialData = {
  technique: "xy-wing",
  explanation: {
    what: "An XY-Wing consists of a pivot cell with candidates {X,Y} and two wing cells: one with {X,Z} and one with {Y,Z}, where each wing sees the pivot. Any cell that sees both wings can have Z eliminated, because one wing must contain Z.",
    when: "Look for a cell with exactly two candidates (the pivot) that sees two other bi-value cells. The three cells should collectively hold three distinct values, with each pair sharing one value.",
    why: "The pivot is either X or Y. If it is X, the {Y,Z} wing must be Z. If it is Y, the {X,Z} wing must be Z. Either way, one wing contains Z. Any cell seeing both wings cannot be Z.",
  },
  boardState: [
    0,0,0, 0,8,0, 0,0,0,
    0,8,0, 0,0,7, 0,3,0,
    0,0,1, 6,0,0, 0,0,8,

    8,0,0, 0,0,0, 1,0,0,
    0,0,0, 0,1,0, 0,0,0,
    0,0,6, 0,0,0, 0,0,9,

    6,0,0, 0,0,4, 9,0,0,
    0,1,0, 9,0,0, 0,6,0,
    0,0,0, 0,6,0, 0,0,0,
  ],
  candidates: {
    // Pivot: R1C1 (index 0) with candidates {3, 5}
    // Wing 1: R1C6 (index 5) with candidates {3, 9} — sees pivot via row 1
    // Wing 2: R3C1 (index 18) with candidates {5, 9} — sees pivot via column 1
    // Elimination: Z=9, eliminate from cells seeing both wings
    // R3C6 (index 23) sees wing1 (row... no, col 6) and wing2 (row 3)
    0: [3, 5],
    5: [3, 9],
    18: [5, 9],
    // Cells that see both wings and have 9 as candidate:
    23: [2, 3, 5, 9],
  },
  steps: [
    {
      description: "Let's find an XY-Wing. We start by looking for a pivot cell with exactly two candidates. R1C1 has candidates {3, 5} — this is our pivot.",
      highlightCells: [0],
      highlightCandidates: [{ cell: 0, values: [3, 5] }],
    },
    {
      description: "Now find two wing cells that the pivot can see (same row, column, or box), each with two candidates, sharing one value with the pivot. R1C6 has {3, 9} — shares 3 with the pivot. R3C1 has {5, 9} — shares 5 with the pivot.",
      highlightCells: [0, 5, 18],
      highlightCandidates: [
        { cell: 0, values: [3, 5] },
        { cell: 5, values: [3, 9] },
        { cell: 18, values: [5, 9] },
      ],
    },
    {
      description: "The three values are X=3, Y=5, Z=9. The pivot is {3,5}. Wing 1 is {3,9} (X,Z). Wing 2 is {5,9} (Y,Z). If the pivot is 3, then wing 2 must be 9. If the pivot is 5, then wing 1 must be 9. Either way, one of the wings must be 9.",
      highlightCells: [0, 5, 18],
      highlightCandidates: [
        { cell: 0, values: [3, 5] },
        { cell: 5, values: [9] },
        { cell: 18, values: [9] },
      ],
    },
    {
      description: "Any cell that can see both wing cells can have 9 eliminated. R3C6 (index 23) sees wing 1 via column 6 and wing 2 via row 3, and has 9 as a candidate. Remove 9 from R3C6.",
      highlightCells: [5, 18],
      eliminateCandidates: [{ cell: 23, values: [9] }],
    },
  ],
};
