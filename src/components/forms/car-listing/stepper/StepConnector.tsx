
/**
 * StepConnector Component
 * Renders the connecting line between step circles
 */

import { cn } from '@/lib/utils';

interface StepConnectorProps {
  isCompleted: boolean;
}

export const StepConnector = ({ isCompleted }: StepConnectorProps) => {
  return (
    <div className="absolute top-5 left-10 w-full h-0.5" aria-hidden="true">
      <div className={cn(
        "h-0.5 w-[calc(100%-20px)]",
        isCompleted ? "bg-[#DC143C]" : "bg-gray-200"
      )} />
    </div>
  );
};
