import type { TutorialData } from "../bible-tutorials";

export const nakedPairTutorial: TutorialData = {
  technique: "naked-pair",
  explanation: {
    what: "A Naked Pair occurs when two cells in the same unit (row, column, or box) have exactly the same two candidates and no others. Since those two values must go in those two cells, they can be eliminated from all other cells in that unit.",
    when: "Look for pairs of cells within a unit that share the exact same two candidates. This is most useful after you have exhausted all singles.",
    why: "If two cells in a unit can only contain values A and B, then one cell gets A and the other gets B. No other cell in that unit can contain A or B.",
  },
  boardState: [
    1,0,0, 0,0,6, 0,8,0,
    0,0,0, 0,0,0, 7,0,0,
    0,6,0, 0,0,0, 0,0,5,

    6,0,0, 0,0,0, 0,0,4,
    0,0,0, 5,0,1, 0,0,0,
    2,0,0, 0,0,0, 0,0,8,

    7,0,0, 0,0,0, 0,5,0,
    0,0,4, 0,0,0, 0,0,0,
    0,5,0, 6,0,0, 0,0,1,
  ],
  candidates: {
    1: [3, 4],
    2: [3, 5, 9],
    3: [2, 3, 4, 7, 9],
    4: [2, 4, 7, 9],
    6: [2, 3, 9],
    8: [2, 3, 9],
    // Focus: cells 1 and some other in row 1 forming a naked pair {3,4}
  },
  steps: [
    {
      description: "Let's find a Naked Pair. Look at row 1. Several cells are empty. We need to examine their candidates.",
      highlightCells: [1, 2, 3, 4, 6, 8],
    },
    {
      description: "R1C2 has candidates {3, 4}. Now let's look for another cell in row 1 with exactly the same two candidates.",
      highlightCells: [1],
      highlightCandidates: [{ cell: 1, values: [3, 4] }],
    },
    {
      description: "R1C4 has candidates {2, 3, 4, 7, 9} — too many. R1C5 has {2, 4, 7, 9}. But notice R1C3 has {3, 5, 9} and others don't match. Let's look at box 1 instead. In box 1, both R1C2 and R2C1 might form a pair.",
      highlightCells: [1, 2, 3, 4],
      highlightCandidates: [
        { cell: 1, values: [3, 4] },
        { cell: 2, values: [3, 5, 9] },
        { cell: 3, values: [2, 3, 4, 7, 9] },
        { cell: 4, values: [2, 4, 7, 9] },
      ],
    },
    {
      description: "R1C2 has {3, 4}. These two values must occupy the pair cells. Therefore, we can eliminate 3 and 4 from all other cells in their shared units.",
      highlightCells: [1],
      highlightCandidates: [{ cell: 1, values: [3, 4] }],
      eliminateCandidates: [
        { cell: 2, values: [3] },
        { cell: 3, values: [3, 4] },
        { cell: 4, values: [4] },
      ],
    },
  ],
};
