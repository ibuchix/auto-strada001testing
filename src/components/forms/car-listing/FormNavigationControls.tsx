
/**
 * Form Navigation Controls
 * Provides navigation buttons for a multi-step form with improved visual hierarchy
 * Enhanced with micro-interactions for better user feedback
 * - 2027-11-21: Updated props interface for better type safety
 * - 2028-03-27: Updated function signatures to match required return types
 * - 2028-03-28: Fixed navigation button handling to prevent errors and provide better feedback
 * - 2028-11-16: Fixed Next button functionality by improving error handling and event flow
 * - 2025-04-05: Added extensive logging for debugging navigation issues
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
  const [isNextActive, setIsNextActive] = useState(false);
  const [isPrevActive, setIsPrevActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const requestId = Math.random().toString(36).substring(2, 8);
  
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

  // Handle next button click with enhanced logging and error handling
  const handleNextClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default form submission
    
    const clickTimestamp = new Date().toISOString();
    console.log(`[NavControls][${requestId}] Next button clicked at ${clickTimestamp}, current states:`, {
      isProcessing,
      isNavigating,
      isNextActive,
      timestamp: clickTimestamp
    });
    
    if (isProcessing || isNavigating) {
      console.log(`[NavControls][${requestId}] Navigation already in progress, ignoring click`);
      toast.info("Please wait...", { description: "Navigation already in progress" });
      return;
    }
    
    try {
      console.log(`[NavControls][${requestId}] Starting next navigation, setting isProcessing to true`);
      setIsProcessing(true);
      
      const startTime = performance.now();
      
      // Add a timeout safety net
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("Navigation timeout")), 10000);
      });
      
      // Try to navigate with timeout protection
      await Promise.race([
        onNext(),
        timeoutPromise
      ]);
      
      const endTime = performance.now();
      console.log(`[NavControls][${requestId}] Navigation completed successfully in ${(endTime-startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error(`[NavControls][${requestId}] Error navigating to next step:`, error);
      
      // Show user-friendly error message
      toast.error("Navigation failed", { 
        description: error instanceof Error ? error.message : "Please try again" 
      });
      
      // Force reset the navigation state after error
      setTimeout(() => {
        console.log(`[NavControls][${requestId}] Forcibly resetting navigation state after error`);
        setIsProcessing(false);
      }, 500);
    } finally {
      console.log(`[NavControls][${requestId}] Navigation attempt completed, resetting isProcessing`);
      setIsProcessing(false);
    }
  };
  
  // Handle previous button click with enhanced logging
  const handlePreviousClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default form submission
    
    const clickTimestamp = new Date().toISOString();
    console.log(`[NavControls][${requestId}] Previous button clicked at ${clickTimestamp}, current states:`, {
      isProcessing,
      isNavigating,
      isPrevActive,
      timestamp: clickTimestamp
    });
    
    if (isProcessing || isNavigating) {
      console.log(`[NavControls][${requestId}] Navigation already in progress, ignoring click`);
      toast.info("Please wait...", { description: "Navigation already in progress" });
      return;
    }
    
    try {
      console.log(`[NavControls][${requestId}] Starting previous navigation, setting isProcessing to true`);
      setIsProcessing(true);
      
      const startTime = performance.now();
      await onPrevious();
      const endTime = performance.now();
      
      console.log(`[NavControls][${requestId}] Previous navigation completed successfully in ${(endTime-startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error(`[NavControls][${requestId}] Error navigating to previous step:`, error);
      toast.error("Navigation failed", { 
        description: "Could not go back to previous step" 
      });
    } finally {
      console.log(`[NavControls][${requestId}] Previous navigation attempt completed, resetting isProcessing`);
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
          isDisabled={isNavigating || isProcessing}
        />
        
        {!isLastStep ? (
          <Button
            type="button"
            onClick={handleNextClick}
            disabled={isNavigating || isProcessing}
            className={`flex items-center gap-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6 group transition-all duration-300 ${isNextActive ? 'animate-fade-in' : ''}`}
            data-testid="next-button"
          >
            Next
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isNavigating || isProcessing}
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
