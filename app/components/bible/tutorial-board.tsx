import { cn } from "~/lib/utils";
import type { TutorialStep } from "~/data/bible-tutorials";

interface TutorialBoardProps {
  boardState: number[];
  candidates: Record<number, number[]>;
  currentStep: TutorialStep;
}

const NOTE_POSITIONS = [
  "col-start-1 row-start-1", // 1
  "col-start-2 row-start-1", // 2
  "col-start-3 row-start-1", // 3
  "col-start-1 row-start-2", // 4
  "col-start-2 row-start-2", // 5
  "col-start-3 row-start-2", // 6
  "col-start-1 row-start-3", // 7
  "col-start-2 row-start-3", // 8
  "col-start-3 row-start-3", // 9
];

function TutorialCell({
  index,
  value,
  candidates,
  isHighlighted,
  isEliminate,
  highlightedCandidates,
  eliminatedCandidates,
  placement,
}: {
  index: number;
  value: number;
  candidates: number[];
  isHighlighted: boolean;
  isEliminate: boolean;
  highlightedCandidates: number[];
  eliminatedCandidates: number[];
  placement: number | null;
}) {
  const row = Math.floor(index / 9);
  const col = index % 9;

  const highlightSet = new Set(highlightedCandidates);
  const eliminateSet = new Set(eliminatedCandidates);

  const displayValue = placement ?? value;
  const hasCandidates = candidates.length > 0 && displayValue === 0;

  return (
    <div
      role="gridcell"
      aria-label={`Row ${row + 1}, Column ${col + 1}${displayValue > 0 ? `, value ${displayValue}` : ", empty"}`}
      className={cn(
        "aspect-square flex items-center justify-center relative",
        "border-r border-b border-foreground/[0.12]",
        "transition-colors duration-300",
        // Box borders
        col % 3 === 0 && col > 0 && "border-l-2 border-l-foreground/50",
        row % 3 === 0 && row > 0 && "border-t-2 border-t-foreground/50",
        // Background states
        isHighlighted && "bg-emerald-100 dark:bg-emerald-900/40",
        isEliminate && "bg-red-100 dark:bg-red-900/30",
        placement !== null && "bg-emerald-200 dark:bg-emerald-800/50",
        // Default
        !isHighlighted && !isEliminate && placement === null && "bg-background",
      )}
    >
      {displayValue > 0 ? (
        <span
          className={cn(
            "text-[clamp(0.875rem,3.5cqi,1.5rem)] leading-none font-bold font-mono",
            placement !== null && "text-emerald-700 dark:text-emerald-300",
            placement === null && value > 0 && "text-foreground",
          )}
        >
          {displayValue}
        </span>
      ) : hasCandidates ? (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[1px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
            const isCandidate = candidates.includes(n);
            const isHighlightedCandidate = highlightSet.has(n);
            const isEliminatedCandidate = eliminateSet.has(n);

            return (
              <span
                key={n}
                className={cn(
                  NOTE_POSITIONS[n - 1],
                  "flex items-center justify-center text-[clamp(0.35rem,1.3cqi,0.55rem)] leading-none font-mono",
                  isCandidate && !isHighlightedCandidate && !isEliminatedCandidate && "text-muted-foreground",
                  isHighlightedCandidate && "text-emerald-600 dark:text-emerald-400 font-bold",
                  isEliminatedCandidate && "text-red-500 dark:text-red-400 line-through font-bold",
                  !isCandidate && !isEliminatedCandidate && "text-transparent",
                )}
              >
                {(isCandidate || isEliminatedCandidate) ? n : ""}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function TutorialBoard({ boardState, candidates, currentStep }: TutorialBoardProps) {
  const highlightSet = new Set(currentStep.highlightCells);
  const eliminateSet = new Set(currentStep.eliminateCells ?? []);

  // Build lookup maps for candidate highlights
  const highlightCandidateMap = new Map<number, number[]>();
  for (const hc of currentStep.highlightCandidates ?? []) {
    highlightCandidateMap.set(hc.cell, hc.values);
  }

  const eliminateCandidateMap = new Map<number, number[]>();
  for (const ec of currentStep.eliminateCandidates ?? []) {
    eliminateCandidateMap.set(ec.cell, ec.values);
  }

  const placementMap = new Map<number, number>();
  for (const pc of currentStep.placementCells ?? []) {
    placementMap.set(pc.cell, pc.value);
  }

  return (
    <div
      role="grid"
      aria-label="Tutorial sudoku board"
      className={cn(
        "grid grid-cols-9",
        "border-[2.5px] border-foreground/50 rounded-lg overflow-hidden",
        "w-full max-w-sm mx-auto aspect-square",
      )}
      style={{ containerType: "inline-size" }}
    >
      {boardState.map((value, index) => (
        <TutorialCell
          key={index}
          index={index}
          value={value}
          candidates={candidates[index] ?? []}
          isHighlighted={highlightSet.has(index)}
          isEliminate={eliminateSet.has(index)}
          highlightedCandidates={highlightCandidateMap.get(index) ?? []}
          eliminatedCandidates={eliminateCandidateMap.get(index) ?? []}
          placement={placementMap.get(index) ?? null}
        />
      ))}
    </div>
  );
}
