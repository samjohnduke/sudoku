import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const { values } = parseArgs({
  options: {
    file: { type: "string" },
    db: { type: "string" },
    remote: { type: "boolean", default: false },
  },
});

if (!values.file || !values.db) {
  console.error("Usage: npx tsx tools/upload.ts --file=puzzles.json --db=supersudoku-db [--remote]");
  process.exit(1);
}

const filePath = values.file;
const dbName = values.db;
const remoteFlag = values.remote ? "--remote" : "--local";

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

const puzzles: PuzzleRecord[] = JSON.parse(readFileSync(filePath, "utf-8"));
console.log(`Loaded ${puzzles.length} puzzles from ${filePath}`);

const BATCH_SIZE = 50;
const totalBatches = Math.ceil(puzzles.length / BATCH_SIZE);

function escapeSQL(value: string): string {
  return value.replace(/'/g, "''");
}

for (let i = 0; i < puzzles.length; i += BATCH_SIZE) {
  const batch = puzzles.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;

  const rows = batch
    .map((p) => {
      const techniques = escapeSQL(JSON.stringify(p.techniques_required));
      return `('${escapeSQL(p.id)}', '${escapeSQL(p.puzzle)}', '${escapeSQL(p.solution)}', ${p.difficulty_score}, '${escapeSQL(p.difficulty_label)}', '${techniques}', ${p.clue_count}, '${escapeSQL(p.created_at)}')`;
    })
    .join(",\n  ");

  const sql = `INSERT INTO puzzles (id, puzzle, solution, difficulty_score, difficulty_label, techniques_required, clue_count, created_at) VALUES\n  ${rows};`;

  console.log(`Uploading batch ${batchNum}/${totalBatches} (${batch.length} puzzles)...`);

  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", dbName, remoteFlag, `--command=${sql}`],
    { stdio: "inherit" },
  );
}

console.log(`Done! Uploaded ${puzzles.length} puzzles.`);
