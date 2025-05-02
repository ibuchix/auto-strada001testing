
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
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { SaveAndContinueButton } from "./SaveAndContinueButton";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface FormNavigationControlsProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => Promise<void>;
  onNext: () => Promise<void>;
  isNavigating: boolean;
  onSave: () => Promise<void>;
  carId?: string;
}

export const FormNavigationControls = ({
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
  isNavigating,
  onSave,
  carId
}: FormNavigationControlsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleNextClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isProcessing || isNavigating) {
      toast.info("Please wait...");
      return;
    }
    
    try {
      setIsProcessing(true);
      await onNext();
    } catch (error) {
      console.error("Error navigating to next step:", error);
      toast.error("Navigation failed", { 
        description: error instanceof Error ? error.message : "Please try again" 
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePreviousClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isProcessing || isNavigating) {
      toast.info("Please wait...");
      return;
    }
    
    try {
      setIsProcessing(true);
      await onPrevious();
    } catch (error) {
      console.error("Error navigating to previous step:", error);
      toast.error("Navigation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div>
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePreviousClick}
            disabled={isNavigating || isProcessing}
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 group transition-all duration-300"
          >
            <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Previous
          </Button>
        )}
      </div>
      
      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onSave}
          disabled={isNavigating || isProcessing}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Progress
        </Button>
        
        {!isLastStep ? (
          <Button
            type="button"
            onClick={handleNextClick}
            disabled={isNavigating || isProcessing}
            className="flex items-center gap-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6 group transition-all duration-300"
            data-testid="next-button"
          >
            {isProcessing ? "Processing..." : "Next"}
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isNavigating || isProcessing}
            className="flex items-center gap-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6 group transition-all duration-300"
          >
            {isProcessing ? "Processing..." : "Submit"}
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
