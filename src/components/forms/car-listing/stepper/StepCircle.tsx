
/**
 * StepCircle Component
 * Renders an individual step circle with appropriate styling and state
 * Enhanced to better indicate completion status
 */

import { Check, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StepCircleProps {
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isAccessible: boolean;
  hasError: boolean;
  stepTitle: string;
  stepDescription?: string;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const StepCircle = ({
  index,
  isActive,
  isCompleted,
  isAccessible,
  hasError,
  stepTitle,
  stepDescription,
  onClick,
  onKeyDown
}: StepCircleProps) => {
  return (
    <span className="flex h-10 items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClick}
              onKeyDown={onKeyDown}
              disabled={!isAccessible}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Step ${index + 1}: ${stepTitle}${hasError ? ' (has errors)' : isCompleted ? ' (completed)' : ''}`}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#DC143C]/40 focus:ring-offset-2 relative",
                hasError ? "ring-2 ring-red-500" : "",
                isCompleted 
                  ? "bg-[#21CA6F] hover:bg-[#21CA6F]/90" 
                  : isActive 
                    ? "bg-[#DC143C] text-white"
                    : isAccessible 
                      ? "bg-white border-2 border-[#DC143C] hover:border-[#DC143C]/80"
                      : "bg-white border-2 border-gray-300 cursor-not-allowed"
              )}
            >
              {hasError && (
                <AlertCircle className="h-5 w-5 text-red-500 absolute -top-1 -right-1 bg-white rounded-full" />
              )}
              {isCompleted ? (
                <Check className="h-5 w-5 text-white" aria-hidden="true" />
              ) : isActive ? (
                <span className="text-sm font-semibold text-white">{index + 1}</span>
              ) : (
                <span className={cn(
                  "text-sm font-semibold", 
                  isAccessible ? "text-[#DC143C]" : "text-gray-500"
                )}>
                  {index + 1}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{stepTitle}</p>
            {stepDescription && <p className="text-xs opacity-80">{stepDescription}</p>}
            {hasError && <p className="text-red-500 text-xs">This step has errors</p>}
            {isCompleted && !hasError && <p className="text-green-500 text-xs">Step completed</p>}
            {isActive && !isCompleted && !hasError && (
              <div className="flex items-center text-[#DC143C] text-xs">
                <Clock className="h-3 w-3 mr-1" />
                <span>In progress</span>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
};
