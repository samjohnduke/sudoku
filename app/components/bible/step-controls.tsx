import { cn } from "~/lib/utils";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function StepControls({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onReset,
}: StepControlsProps) {
  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={onReset}
        disabled={currentStep === 0}
        className={cn(
          "p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center",
          currentStep === 0
            ? "text-muted-foreground/30"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
        )}
        aria-label="Reset"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={onPrevious}
          disabled={currentStep === 0}
          className={cn(
            "p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center",
            currentStep === 0
              ? "text-muted-foreground/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary",
          )}
          aria-label="Previous step"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs text-muted-foreground tabular-nums font-mono w-12 text-center">
          {currentStep + 1} / {totalSteps}
        </span>

        <button
          onClick={onNext}
          disabled={currentStep === totalSteps - 1}
          className={cn(
            "p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center",
            currentStep === totalSteps - 1
              ? "text-muted-foreground/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary",
          )}
          aria-label="Next step"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
