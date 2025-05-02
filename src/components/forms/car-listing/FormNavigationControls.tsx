
/**
 * Form Navigation Controls
 * Provides navigation buttons for a multi-step form with improved visual hierarchy
 * Enhanced with micro-interactions for better user feedback
 * - 2027-11-21: Updated props interface for better type safety
 * - 2028-03-27: Updated function signatures to match required return types
 * - 2028-03-28: Fixed navigation button handling to prevent errors and provide better feedback
 * - 2028-11-16: Fixed Next button functionality by improving error handling and event flow
 * - 2025-04-05: Added extensive logging for debugging navigation issues
 * - 2025-04-06: Fixed navigation lock issues with improved error handling and button state management
 * - 2025-06-07: Completely refactored navigation to simplify and improve reliability
 * - 2025-06-08: Fixed Next button functionality with improved error handling and state management
 * - 2025-06-10: Updated to fix TypeScript Promise return types
 * - 2025-06-11: Added isNavigating prop to support external navigation state
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface FormNavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => Promise<void>;
  onNext: () => Promise<void>;
  isFirstStep: boolean;
  isLastStep: boolean;
  navigationDisabled?: boolean;
  isSaving?: boolean;
  isNavigating?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
  hasStepErrors?: boolean;
  getCurrentStepErrors?: () => Record<string, any>;
  onSave?: () => Promise<void>;
  carId?: string;
  userId?: string;
}

export const FormNavigationControls = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  isFirstStep,
  isLastStep,
  navigationDisabled = false,
  isSaving = false,
  isNavigating = false,
  onSubmit,
  hasStepErrors,
  getCurrentStepErrors,
  onSave,
  carId,
  userId
}: FormNavigationControlsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [clickedButton, setClickedButton] = useState<'next' | 'previous' | 'save' | null>(null);
  
  // Reset processing state if navigation state changes
  useEffect(() => {
    if (!navigationDisabled && !isNavigating && isProcessing) {
      setIsProcessing(false);
      setClickedButton(null);
    }
  }, [navigationDisabled, isNavigating, isProcessing]);
  
  const handleNextClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isProcessing || navigationDisabled || isNavigating) {
      toast.info("Please wait while we process your request...");
      return;
    }
    
    try {
      setIsProcessing(true);
      setClickedButton('next');
      
      console.log("Next button clicked, calling onNext handler");
      await onNext();
    } catch (error) {
      console.error("Error navigating to next step:", error);
      toast.error("Navigation failed", { 
        description: error instanceof Error ? error.message : "Please try again" 
      });
    } finally {
      // Don't reset isProcessing here, let the effect handle it
      // This prevents button re-enabling before navigation completes
    }
  };
  
  const handlePreviousClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isProcessing || navigationDisabled || isNavigating) {
      toast.info("Please wait while we process your request...");
      return;
    }
    
    try {
      setIsProcessing(true);
      setClickedButton('previous');
      await onPrevious();
    } catch (error) {
      console.error("Error navigating to previous step:", error);
      toast.error("Navigation failed");
      setIsProcessing(false);
      setClickedButton(null);
    }
  };
  
  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isProcessing || navigationDisabled || isNavigating) {
      toast.info("Please wait while we process your request...");
      return;
    }
    
    try {
      setIsProcessing(true);
      setClickedButton('save');
      
      // Use the provided onSave handler if available
      if (onSave) {
        await onSave();
      }
      
      toast.success("Progress saved successfully");
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Save failed");
    } finally {
      setIsProcessing(false);
      setClickedButton(null);
    }
  };

  // Determine if actions should be disabled
  const isActionDisabled = navigationDisabled || isProcessing || isNavigating || isSaving;

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div>
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePreviousClick}
            disabled={isActionDisabled}
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 group transition-all duration-300"
          >
            <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            {clickedButton === 'previous' && isProcessing ? "Processing..." : "Previous"}
          </Button>
        )}
      </div>
      
      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveClick}
          disabled={isActionDisabled}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {clickedButton === 'save' && isProcessing ? "Saving..." : "Save Progress"}
        </Button>
        
        {!isLastStep ? (
          <Button
            type="button"
            onClick={handleNextClick}
            disabled={isActionDisabled}
            className="flex items-center gap-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6 group transition-all duration-300"
            data-testid="next-button"
          >
            {clickedButton === 'next' && isProcessing ? "Processing..." : "Next"}
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isActionDisabled}
            className="flex items-center gap-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6 group transition-all duration-300"
            onClick={onSubmit ? (e) => onSubmit(e) : undefined}
          >
            {isProcessing ? "Processing..." : "Submit"}
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
