import { cn } from "~/lib/utils";
import { Delete, Undo2, Redo2 } from "lucide-react";

export type InputMode = "value" | "notes";

interface NumberPadProps {
  onNumber: (n: number) => void;
  onDelete: () => void;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  completedNumbers?: Set<number>;
}

const modes: { value: InputMode; label: string }[] = [
  { value: "value", label: "Value" },
  { value: "notes", label: "Notes" },
];

export function NumberPad({
  onNumber,
  onDelete,
  mode,
  onModeChange,
  onUndo,
  onRedo,
  completedNumbers,
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

      {/* Number grid: 4 columns — 1,2,3,⌫ / 4,5,6,↩ / 7,8,9,↪ */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { type: "number" as const, value: 1 },
          { type: "number" as const, value: 2 },
          { type: "number" as const, value: 3 },
          { type: "action" as const, action: "delete" as const },
          { type: "number" as const, value: 4 },
          { type: "number" as const, value: 5 },
          { type: "number" as const, value: 6 },
          { type: "action" as const, action: "undo" as const },
          { type: "number" as const, value: 7 },
          { type: "number" as const, value: 8 },
          { type: "number" as const, value: 9 },
          { type: "action" as const, action: "redo" as const },
        ].map((item, i) =>
          item.type === "number" ? (
            <button
              key={i}
              disabled={mode === "value" && completedNumbers?.has(item.value)}
              className={cn(
                "font-mono text-lg font-medium",
                "h-12 rounded-xl",
                "transition-colors duration-100",
                "flex items-center justify-center",
                mode === "value" && completedNumbers?.has(item.value)
                  ? "bg-secondary/30 text-muted-foreground/30 cursor-default"
                  : "bg-secondary/60 hover:bg-secondary active:bg-secondary/80",
              )}
              onClick={() => onNumber(item.value)}
              aria-label={`Enter ${mode === "notes" ? "note " : ""}${item.value}`}
            >
              {item.value}
            </button>
          ) : (
            <button
              key={i}
              className={cn(
                "h-12 rounded-xl",
                "bg-secondary/60 hover:bg-secondary active:bg-secondary/80",
                "transition-colors duration-100",
                "flex items-center justify-center text-muted-foreground",
              )}
              onClick={
                item.action === "delete" ? onDelete :
                item.action === "undo" ? onUndo : onRedo
              }
              aria-label={item.action === "delete" ? "Delete" : item.action === "undo" ? "Undo" : "Redo"}
            >
              {item.action === "delete" ? <Delete className="w-5 h-5" /> :
               item.action === "undo" ? <Undo2 className="w-5 h-5" /> :
               <Redo2 className="w-5 h-5" />}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
