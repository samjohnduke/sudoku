import { cn } from "~/lib/utils";
import { Delete, Undo2, Redo2 } from "lucide-react";

export type InputMode = "value" | "corner" | "center";

interface NumberPadProps {
  onNumber: (n: number) => void;
  onDelete: () => void;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const modes: { value: InputMode; label: string }[] = [
  { value: "value", label: "Value" },
  { value: "corner", label: "Corner" },
  { value: "center", label: "Center" },
];

export function NumberPad({
  onNumber,
  onDelete,
  mode,
  onModeChange,
  onUndo,
  onRedo,
}: NumberPadProps) {
  return (
    <div className="flex flex-col gap-3 max-w-md mx-auto w-full px-1" role="group" aria-label="Number pad">
      {/* Segmented mode toggle */}
      <div className="flex bg-secondary rounded-xl p-1 gap-0.5" role="radiogroup" aria-label="Input mode">
        {modes.map((m) => (
          <button
            key={m.value}
            role="radio"
            aria-checked={mode === m.value}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              mode === m.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onModeChange(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Number grid: 4 columns */}
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            className={cn(
              "font-mono text-lg font-medium",
              "h-12 rounded-xl",
              "bg-secondary/60 hover:bg-secondary active:bg-secondary/80",
              "transition-colors duration-100",
              "flex items-center justify-center",
            )}
            onClick={() => onNumber(n)}
            aria-label={`Enter ${mode === "value" ? "" : mode + " note "}${n}`}
          >
            {n}
          </button>
        ))}
        <button
          className={cn(
            "h-12 rounded-xl",
            "bg-secondary/60 hover:bg-secondary active:bg-secondary/80",
            "transition-colors duration-100",
            "flex items-center justify-center text-muted-foreground",
          )}
          onClick={onDelete}
          aria-label="Delete"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          className={cn(
            "h-12 rounded-xl",
            "bg-secondary/60 hover:bg-secondary active:bg-secondary/80",
            "transition-colors duration-100",
            "flex items-center justify-center text-muted-foreground",
          )}
          onClick={onUndo}
          aria-label="Undo"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          className={cn(
            "h-12 rounded-xl",
            "bg-secondary/60 hover:bg-secondary active:bg-secondary/80",
            "transition-colors duration-100",
            "flex items-center justify-center text-muted-foreground",
          )}
          onClick={onRedo}
          aria-label="Redo"
        >
          <Redo2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
