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
    <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
      {/* Mode toggle row */}
      <div className="flex gap-2">
        {modes.map((m) => (
          <Button
            key={m.value}
            variant={mode === m.value ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => onModeChange(m.value)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Button
            key={n}
            variant="outline"
            className={cn("text-lg font-semibold aspect-square h-auto")}
            onClick={() => onNumber(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="outline"
          className="text-sm aspect-square h-auto"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>

      {/* Undo / Redo */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onUndo}
        >
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onRedo}
        >
          Redo
        </Button>
      </div>
    </div>
  );
}
