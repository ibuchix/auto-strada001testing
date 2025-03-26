
/**
 * Changes made:
 * - 2023-07-15: Updated props to include progress percentage and fixed step display
 */

import { Progress } from "@/components/ui/progress";
import { Check, Clock } from "lucide-react";

interface FormProgressProps {
  progress: number;
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const FormProgress = ({ 
  progress, 
  currentStep = 0,
  onStepClick
}: FormProgressProps) => {
  return (
    <div className="space-y-2 mb-6">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Form Progress</span>
        <span>{progress}%</span>
      </div>
      <Progress 
        value={progress} 
        className="h-2 bg-accent"
      />
    </div>
  );
}
