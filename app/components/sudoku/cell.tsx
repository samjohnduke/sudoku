import { cn } from "~/lib/utils";

interface CellProps {
  index: number;
  value: number;
  isInitial: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isError: boolean;
  isHint: boolean;
  isSameRow: boolean;
  isSameCol: boolean;
  isSameBox: boolean;
  isComplete: boolean;
  notes: Set<number>;
  centerNotes: Set<number>;
  onSelect: (index: number) => void;
}

const NOTE_POSITIONS = [
  "col-start-1 row-start-1",
  "col-start-2 row-start-1",
  "col-start-3 row-start-1",
  "col-start-1 row-start-2",
  "col-start-2 row-start-2",
  "col-start-3 row-start-2",
  "col-start-1 row-start-3",
  "col-start-2 row-start-3",
  "col-start-3 row-start-3",
];

export function Cell({
  index,
  value,
  isInitial,
  isSelected,
  isHighlighted,
  isError,
  isHint,
  isSameRow,
  isSameCol,
  isSameBox,
  isComplete,
  notes,
  centerNotes,
  onSelect,
}: CellProps) {
  const row = Math.floor(index / 9);
  const col = index % 9;

  const hasCornerNotes = notes.size > 0;
  const hasCenterNotes = centerNotes.size > 0;

  return (
    <button
      type="button"
      role="gridcell"
      aria-label={`Row ${row + 1}, Column ${col + 1}${value > 0 ? `, value ${value}` : ", empty"}`}
      aria-selected={isSelected}
      className={cn(
        "aspect-square flex items-center justify-center relative",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset",
        "border-r border-b border-foreground/[0.12]",
        col % 3 === 0 && col > 0 && "border-l-[2px] border-l-foreground/50",
        row % 3 === 0 && row > 0 && "border-t-[2px] border-t-foreground/50",
        isSelected
          ? "bg-primary/12"
          : isHint
            ? "bg-amber-200/40 dark:bg-amber-500/20"
            : isHighlighted
              ? "bg-primary/8"
              : (isSameRow || isSameCol || isSameBox)
                ? "bg-foreground/[0.03]"
                : "bg-background",
        isComplete && "animate-cell-ripple",
        !isComplete && "active:animate-cell-tap",
      )}
      style={isComplete ? { animationDelay: `${(row * 9 + col) * 12}ms` } : undefined}
      onClick={() => onSelect(index)}
    >
      {value > 0 ? (
        <span
          className={cn(
            "font-mono text-[clamp(0.9rem,3.8cqi,1.75rem)] leading-none",
            isError && "text-destructive",
            !isError && isInitial && "font-semibold text-foreground",
            !isError && !isInitial && "text-primary font-medium",
            !isInitial && "animate-cell-pop",
          )}
        >
          {value}
        </span>
      ) : hasCornerNotes ? (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[1px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span
              key={n}
              className={cn(
                NOTE_POSITIONS[n - 1],
                "flex items-center justify-center font-mono text-[clamp(0.35rem,1.4cqi,0.6rem)] leading-none text-muted-foreground",
              )}
            >
              {notes.has(n) ? n : ""}
            </span>
          ))}
        </div>
      ) : hasCenterNotes ? (
        <span className="font-mono text-[clamp(0.45rem,1.7cqi,0.65rem)] leading-none text-muted-foreground tracking-wider">
          {Array.from(centerNotes).sort().join("")}
        </span>
      ) : null}
    </button>
  );
}
