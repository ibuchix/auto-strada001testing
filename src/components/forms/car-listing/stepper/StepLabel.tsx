
/**
 * StepLabel Component
 * Renders the text label below each step circle
 */

import { cn } from '@/lib/utils';

interface StepLabelProps {
  title: string;
  isActive: boolean;
  isCompleted: boolean;
}

export const StepLabel = ({ title, isActive, isCompleted }: StepLabelProps) => {
  return (
    <span className="mt-3 block text-center w-full px-2">
      <span className={cn(
        "text-xs font-medium",
        isActive 
          ? "text-[#DC143C] font-semibold" 
          : isCompleted 
            ? "text-gray-900" 
            : "text-gray-500"
      )}>
        {title}
      </span>
    </span>
  );
};
