import type { Grid, Technique, SolveStep } from "./types";
import { TECHNIQUE_WEIGHTS } from "./types";
import { humanSolve } from "./solver";

export interface GradeResult {
  score: number; // 0-100
  label: string;
  solved: boolean;
  steps: SolveStep[];
  techniquesUsed: Technique[];
}

export function gradePuzzle(grid: Grid): GradeResult {
  const result = humanSolve(grid);
  const techniques = [...result.techniquesUsed];
  const clueCount = grid.flat().filter((v) => v > 0).length;

  const maxWeight = Math.max(0, ...techniques.map((t) => TECHNIQUE_WEIGHTS[t]));
  const totalUses = result.steps.reduce(
    (sum, s) => sum + TECHNIQUE_WEIGHTS[s.technique],
    0,
  );

  const raw = maxWeight * 3 + totalUses * 0.5 + (81 - clueCount) * 0.3;

  // Normalize to 0-100 (calibrated empirically — max realistic raw is ~120)
  const score = Math.min(100, Math.round((raw / 120) * 100));

  return {
    score,
    label: difficultyLabel(score),
    solved: result.solved,
    steps: result.steps,
    techniquesUsed: techniques,
  };
}

export function difficultyLabel(score: number): string {
  if (score <= 15) return "Beginner";
  if (score <= 35) return "Easy";
  if (score <= 55) return "Medium";
  if (score <= 75) return "Hard";
  return "Expert";
}
