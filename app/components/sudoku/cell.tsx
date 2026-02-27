import { cn } from "~/lib/utils";

interface CellProps {
  index: number;
  value: number;
  isInitial: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isError: boolean;
  isSameRow: boolean;
  isSameCol: boolean;
  isSameBox: boolean;
  notes: Set<number>;
  centerNotes: Set<number>;
  onSelect: (index: number) => void;
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

export function Cell({
  index,
  value,
  isInitial,
  isSelected,
  isHighlighted,
  isError,
  isSameRow,
  isSameCol,
  isSameBox,
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
        "aspect-square flex items-center justify-center text-lg transition-colors relative",
        "border-r border-b border-foreground/15",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
        // Box borders: thicker on box boundaries
        col % 3 === 0 && col > 0 && "border-l-2 border-l-foreground/40",
        row % 3 === 0 && row > 0 && "border-t-2 border-t-foreground/40",
        // Background states (ordered by priority)
        isSelected
          ? "bg-primary/15"
          : isHighlighted
            ? "bg-primary/10"
            : (isSameRow || isSameCol || isSameBox)
              ? "bg-primary/5"
              : "",
        // Text states
        isError && "text-destructive",
        !isError && isInitial && "font-bold text-foreground",
        !isError && !isInitial && value > 0 && "text-primary",
      )}
      onClick={() => onSelect(index)}
    >
      {value > 0 ? (
        <span className="text-[clamp(0.875rem,3.5cqi,1.5rem)] leading-none">{value}</span>
      ) : hasCornerNotes ? (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[1px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span
              key={n}
              className={cn(
                NOTE_POSITIONS[n - 1],
                "flex items-center justify-center text-[clamp(0.4rem,1.5cqi,0.625rem)] leading-none text-muted-foreground",
              )}
            >
              {notes.has(n) ? n : ""}
            </span>
          ))}
        </div>
      ) : hasCenterNotes ? (
        <span className="text-[clamp(0.5rem,1.8cqi,0.7rem)] leading-none text-muted-foreground tracking-wider">
          {Array.from(centerNotes).sort().join("")}
        </span>
      ) : null}
    </button>
  );
}
