import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

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
    <div className="flex flex-col gap-2 sm:gap-3 max-w-md mx-auto w-full">
      {/* Mode toggle row */}
      <div className="flex gap-2">
        {modes.map((m) => (
          <Button
            key={m.value}
            variant={mode === m.value ? "default" : "outline"}
            className="flex-1 h-10 sm:h-9 text-sm"
            onClick={() => onModeChange(m.value)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      {/* Number grid: single row on mobile for easy thumb access */}
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Button
            key={n}
            variant="outline"
            className={cn("text-lg font-semibold h-auto min-h-[44px] aspect-square")}
            onClick={() => onNumber(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="outline"
          className="text-sm h-auto min-h-[44px] aspect-square"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>

      {/* Undo / Redo */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 h-10 sm:h-9 text-sm"
          onClick={onUndo}
        >
          Undo
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-10 sm:h-9 text-sm"
          onClick={onRedo}
        >
          Redo
        </Button>
      </div>
    </div>
  );
}
