export type Grid = number[][]; // 9x9, 0 = empty
export type Candidates = Set<number>[][]; // 9x9 sets of possible values

export type Technique =
  | "naked-single"
  | "hidden-single"
  | "naked-pair"
  | "naked-triple"
  | "naked-quad"
  | "hidden-pair"
  | "hidden-triple"
  | "hidden-quad"
  | "pointing-pairs"
  | "box-line-reduction"
  | "x-wing"
  | "swordfish"
  | "xy-wing"
  | "simple-coloring"
  | "jellyfish"
  | "unique-rectangle";

export interface SolveStep {
  technique: Technique;
  cells: [number, number][]; // affected cells [row, col]
  values: number[]; // values involved
  eliminations: { cell: [number, number]; value: number }[];
  placements: { cell: [number, number]; value: number }[];
  description: string; // human-readable explanation
}

export interface SolveResult {
  solved: boolean;
  steps: SolveStep[];
  techniquesUsed: Set<Technique>;
  grid: Grid;
}

export const TECHNIQUE_WEIGHTS: Record<Technique, number> = {
  "naked-single": 1,
  "hidden-single": 2,
  "naked-pair": 4,
  "naked-triple": 4,
  "naked-quad": 8,
  "hidden-pair": 6,
  "hidden-triple": 6,
  "hidden-quad": 9,
  "pointing-pairs": 5,
  "box-line-reduction": 5,
  "x-wing": 10,
  "swordfish": 14,
  "xy-wing": 12,
  "simple-coloring": 13,
  "jellyfish": 18,
  "unique-rectangle": 15,
};

export const TECHNIQUE_CATEGORIES: Record<Technique, string> = {
  "naked-single": "Beginner",
  "hidden-single": "Beginner",
  "naked-pair": "Easy",
  "naked-triple": "Easy",
  "naked-quad": "Medium",
  "hidden-pair": "Medium",
  "hidden-triple": "Medium",
  "hidden-quad": "Medium",
  "pointing-pairs": "Medium",
  "box-line-reduction": "Medium",
  "x-wing": "Hard",
  "swordfish": "Hard",
  "xy-wing": "Hard",
  "simple-coloring": "Hard",
  "jellyfish": "Expert",
  "unique-rectangle": "Expert",
};
