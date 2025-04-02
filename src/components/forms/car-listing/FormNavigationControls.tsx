
/**
 * Form Navigation Controls
 * Provides navigation buttons for a multi-step form with improved visual hierarchy
 * Enhanced with micro-interactions for better user feedback
 * - 2027-11-21: Updated props interface for better type safety
 * - 2028-03-27: Updated function signatures to match required return types
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { SaveAndContinueButton } from "./SaveAndContinueButton";
import { useState, useEffect } from "react";

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
  const [isNextActive, setIsNextActive] = useState(false);
  const [isPrevActive, setIsPrevActive] = useState(false);
  
  // Animation effect when navigating
  useEffect(() => {
    if (!isNavigating) {
      // Add a slight delay to make the animation noticeable
      const timer = setTimeout(() => {
        setIsNextActive(true);
        setIsPrevActive(true);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setIsNextActive(false);
      setIsPrevActive(false);
    }
  }, [isNavigating]);

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div>
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onPrevious()}
            disabled={isNavigating}
            className={`flex items-center gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 group transition-all duration-300 ${isPrevActive ? 'animate-fade-in' : ''}`}
          >
            <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Previous
          </Button>
        )}
      </div>
      
      <div className="flex space-x-3">
        <SaveAndContinueButton 
          onSave={onSave}
          carId={carId}
          isDisabled={isNavigating}
        />
        
        {!isLastStep ? (
          <Button
            type="button"
            onClick={() => onNext()}
            disabled={isNavigating}
            className={`flex items-center gap-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6 group transition-all duration-300 ${isNextActive ? 'animate-fade-in' : ''}`}
          >
            Next
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isNavigating}
            className={`flex items-center gap-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6 group transition-all duration-300 ${isNextActive ? 'animate-fade-in' : ''}`}
          >
            Submit
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
