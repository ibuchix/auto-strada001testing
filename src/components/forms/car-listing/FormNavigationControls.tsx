
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
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { SaveAndContinueButton } from "./SaveAndContinueButton";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePromiseTracking } from "./hooks/usePromiseTracking";
import { TimeoutDurations } from "@/utils/timeoutUtils";

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
  const requestId = useRef(Math.random().toString(36).substring(2, 8)).current;
  
  // Use promise tracking hook to monitor navigation promises
  const { trackPromise } = usePromiseTracking('navigationControls');
  
  // Track button clicks to prevent double-clicking
  const buttonClickTimestamps = useRef<Record<string, number>>({
    next: 0,
    previous: 0
  });
  
  // Process state timeouts for safety
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Reset processing state after timeout to prevent UI getting stuck
  useEffect(() => {
    if (isProcessing) {
      processingTimeoutRef.current = setTimeout(() => {
        console.log(`[NavControls][${requestId}] Forcing reset of processing state after timeout`);
        setIsProcessing(false);
      }, TimeoutDurations.MEDIUM); // 10 seconds max processing time
    }
    
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    };
  }, [isProcessing, requestId]);
  
  // Handle next button click with enhanced logging and error handling
  const handleNextClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default form submission
    
    // Generate unique ID for this click
    const clickId = Math.random().toString(36).substring(2, 6);
    const clickTimestamp = new Date().toISOString();
    
    // Throttle clicks - prevent multiple clicks within 1 second
    const now = Date.now();
    if (now - buttonClickTimestamps.current.next < 1000) {
      console.log(`[NavControls][${requestId}] Next button clicked too quickly, ignoring`);
      return;
    }
    
    // Update click timestamp
    buttonClickTimestamps.current.next = now;
    
    console.log(`[NavControls][${requestId}][${clickId}] Next button clicked at ${clickTimestamp}, current states:`, {
      isProcessing,
      isNavigating,
      isNextActive,
      timestamp: clickTimestamp
    });
    
    if (isProcessing || isNavigating) {
      console.log(`[NavControls][${requestId}][${clickId}] Navigation already in progress, ignoring click`);
      toast.info("Please wait...", { description: "Navigation already in progress" });
      return;
    }
    
    try {
      console.log(`[NavControls][${requestId}][${clickId}] Starting next navigation, setting isProcessing to true`);
      setIsProcessing(true);
      
      const startTime = performance.now();
      
      // Use trackPromise to better monitor the navigation promise
      await trackPromise(
        () => onNext(),
        `nextNavigation-${clickId}`
      );
      
      const endTime = performance.now();
      console.log(`[NavControls][${requestId}][${clickId}] Navigation completed successfully in ${(endTime-startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error(`[NavControls][${requestId}][${clickId}] Error navigating to next step:`, error);
      
      // Show user-friendly error message
      toast.error("Navigation failed", { 
        description: error instanceof Error ? error.message : "Please try again" 
      });
    } finally {
      // Clear any processing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      
      console.log(`[NavControls][${requestId}][${clickId}] Navigation attempt completed, resetting isProcessing`);
      setIsProcessing(false);
    }
  };
  
  // Handle previous button click with enhanced logging
  const handlePreviousClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default form submission
    
    // Generate unique ID for this click
    const clickId = Math.random().toString(36).substring(2, 6);
    const clickTimestamp = new Date().toISOString();
    
    // Throttle clicks - prevent multiple clicks within 1 second
    const now = Date.now();
    if (now - buttonClickTimestamps.current.previous < 1000) {
      console.log(`[NavControls][${requestId}] Previous button clicked too quickly, ignoring`);
      return;
    }
    
    // Update click timestamp
    buttonClickTimestamps.current.previous = now;
    
    console.log(`[NavControls][${requestId}][${clickId}] Previous button clicked at ${clickTimestamp}, current states:`, {
      isProcessing,
      isNavigating,
      isPrevActive,
      timestamp: clickTimestamp
    });
    
    if (isProcessing || isNavigating) {
      console.log(`[NavControls][${requestId}][${clickId}] Navigation already in progress, ignoring click`);
      toast.info("Please wait...", { description: "Navigation already in progress" });
      return;
    }
    
    try {
      console.log(`[NavControls][${requestId}][${clickId}] Starting previous navigation, setting isProcessing to true`);
      setIsProcessing(true);
      
      const startTime = performance.now();
      
      // Use trackPromise for better monitoring
      await trackPromise(
        () => onPrevious(),
        `prevNavigation-${clickId}`
      );
      
      const endTime = performance.now();
      
      console.log(`[NavControls][${requestId}][${clickId}] Previous navigation completed successfully in ${(endTime-startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error(`[NavControls][${requestId}][${clickId}] Error navigating to previous step:`, error);
      toast.error("Navigation failed", { 
        description: "Could not go back to previous step" 
      });
    } finally {
      // Clear any processing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      
      console.log(`[NavControls][${requestId}][${clickId}] Previous navigation attempt completed, resetting isProcessing`);
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
            {isProcessing ? "Processing..." : "Next"}
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isNavigating || isProcessing}
            className={`flex items-center gap-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6 group transition-all duration-300 ${isNextActive ? 'animate-fade-in' : ''}`}
          >
            {isProcessing ? "Processing..." : "Submit"}
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
