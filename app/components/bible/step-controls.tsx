import { Button } from "~/components/ui/button";

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
    <div className="flex items-center justify-between gap-3 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        disabled={currentStep === 0}
      >
        Reset
      </Button>

      <span className="text-sm text-muted-foreground tabular-nums">
        Step {currentStep + 1} of {totalSteps}
      </span>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Button
          size="sm"
          onClick={onNext}
          disabled={currentStep === totalSteps - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
