import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { generatePuzzle } from "../lib/sudoku/generator.js";
import { gradePuzzle } from "../lib/sudoku/grader.js";
import { gridToString } from "../lib/sudoku/utils.js";

const { values } = parseArgs({
  options: {
    count: { type: "string", default: "10" },
    min: { type: "string", default: "0" },
    max: { type: "string", default: "100" },
    "max-removals": { type: "string" },
    output: { type: "string", default: "puzzles.json" },
  },
});

const target = parseInt(values.count!, 10);
const minDifficulty = parseInt(values.min!, 10);
const maxDifficulty = parseInt(values.max!, 10);
const maxRemovals = values["max-removals"] ? parseInt(values["max-removals"]!, 10) : undefined;
const outputPath = values.output!;

interface PuzzleRecord {
  id: string;
  puzzle: string;
  solution: string;
  difficulty_score: number;
  difficulty_label: string;
  techniques_required: string[];
  clue_count: number;
  created_at: string;
}

const puzzles: PuzzleRecord[] = [];
let attempts = 0;

while (puzzles.length < target) {
  attempts++;
  const { puzzle, solution } = generatePuzzle(maxRemovals);
  const grade = gradePuzzle(puzzle);

  if (!grade.solved) {
    process.stdout.write(
      `\r${puzzles.length}/${target} (${attempts} attempts, skipped: unsolvable)`,
    );
    continue;
  }

  if (grade.score < minDifficulty || grade.score > maxDifficulty) {
    process.stdout.write(
      `\r${puzzles.length}/${target} (${attempts} attempts, skipped: score ${grade.score})`,
    );
    continue;
  }

  const clueCount = puzzle.flat().filter((v) => v > 0).length;

  puzzles.push({
    id: randomUUID(),
    puzzle: gridToString(puzzle),
    solution: gridToString(solution),
    difficulty_score: grade.score,
    difficulty_label: grade.label,
    techniques_required: [...grade.techniquesUsed],
    clue_count: clueCount,
    created_at: new Date().toISOString(),
  });

  process.stdout.write(`\r${puzzles.length}/${target} (${attempts} attempts)`);
}

process.stdout.write("\n");

writeFileSync(outputPath, JSON.stringify(puzzles, null, 2));
console.log(`Wrote ${puzzles.length} puzzles to ${outputPath}`);
