export interface TutorialStep {
  description: string;
  highlightCells: number[];
  eliminateCells?: number[];
  highlightCandidates?: { cell: number; values: number[] }[];
  eliminateCandidates?: { cell: number; values: number[] }[];
  placementCells?: { cell: number; value: number }[];
}

export interface TutorialData {
  technique: string;
  explanation: {
    what: string;
    when: string;
    why: string;
  };
  boardState: number[];
  candidates: Record<number, number[]>;
  steps: TutorialStep[];
}
