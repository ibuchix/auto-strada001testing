
/**
 * Changes made:
 * - 2025-06-01: Fixed unsafe postMessage calls and added safety checks
 * - 2025-06-01: Added error handling for cross-origin communication
 * - 2025-06-03: Added rate limiting to URL updates to prevent history.replaceState() security errors
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { CarListingFormData } from "@/types/forms";

// Field to step mapping - which form fields belong to which step
export const STEP_FIELD_MAPPINGS = [
  ["make", "model", "year", "mileage", "vin", "transmission"], // Step 1: Vehicle Details
  ["isDamaged", "damageReports"], // Step 2: Damage
  ["hasWarningLights", "warningLights"], // Step 3: Warning Lights
  ["isSellingOnBehalf", "name", "address", "mobileNumber"], // Step 4: Personal Details
  ["sellerNotes"], // Step 5: Seller Notes
  ["hasServiceHistory", "serviceHistory"], // Step 6: Service History
  ["hasPrivatePlate", "hasFinance", "financeDetails"], // Step 7: Finance Details
  ["features"], // Step 8: Features
  ["images", "rimConditionImages"], // Step 9: Photos
];

export const useStepNavigation = (form: any) => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(STEP_FIELD_MAPPINGS.length);
  const postMessageAttemptedRef = useRef(false);
  
  // For rate limiting URL updates
  const lastUrlUpdateRef = useRef(Date.now());
  const pendingUrlUpdateRef = useRef(false);
  const urlUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Safe postMessage function with error handling
  const safePostMessage = useCallback((data: any) => {
    try {
      // Verify we're not in the top window - we should be in an iframe
      if (window !== window.parent) {
        // Check we haven't already tried recently to avoid spam
        if (!postMessageAttemptedRef.current) {
          window.parent.postMessage(data, '*');
          postMessageAttemptedRef.current = true;
          
          // Reset the flag after a short delay to allow occasional retries
          setTimeout(() => {
            postMessageAttemptedRef.current = false;
          }, 2000);
        }
      }
    } catch (err) {
      console.warn('Error in postMessage communication:', err);
      // Don't rethrow - we want to fail silently if postMessage isn't available
    }
  }, []);
  
  // Initialize from URL parameters if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stepParam = params.get("step");
    
    if (stepParam) {
      const parsedStep = parseInt(stepParam, 10);
      if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep < totalSteps) {
        setCurrentStep(parsedStep);
      }
    }
  }, [location.search, totalSteps]);

  // Rate-limited URL updater
  const updateUrlSafely = useCallback((step: number) => {
    // If there's a pending update, no need to schedule another
    if (pendingUrlUpdateRef.current) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUrlUpdateRef.current;
    const minUpdateInterval = 1000; // Minimum 1 second between updates
    
    if (timeSinceLastUpdate >= minUpdateInterval) {
      // It's safe to update now
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("step", step.toString());
        window.history.replaceState({}, '', url.toString());
        lastUrlUpdateRef.current = now;
        
        // Notify parent frame safely
        safePostMessage({ type: 'step-change', step });
      } catch (error) {
        console.error("Error updating URL with step:", error);
      }
    } else {
      // Schedule an update after the rate limit
      pendingUrlUpdateRef.current = true;
      
      // Clear any existing timer
      if (urlUpdateTimerRef.current) {
        clearTimeout(urlUpdateTimerRef.current);
      }
      
      // Schedule a new update
      urlUpdateTimerRef.current = setTimeout(() => {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("step", step.toString());
          window.history.replaceState({}, '', url.toString());
          lastUrlUpdateRef.current = Date.now();
          pendingUrlUpdateRef.current = false;
          
          // Notify parent frame safely
          safePostMessage({ type: 'step-change', step });
        } catch (error) {
          console.error("Error in delayed URL update:", error);
          pendingUrlUpdateRef.current = false;
        }
      }, minUpdateInterval - timeSinceLastUpdate + 50); // Add a small buffer
    }
  }, [safePostMessage]);

  // Update URL when step changes with rate limiting
  useEffect(() => {
    updateUrlSafely(currentStep);
    
    // Clean up timer on unmount
    return () => {
      if (urlUpdateTimerRef.current) {
        clearTimeout(urlUpdateTimerRef.current);
      }
    };
  }, [currentStep, updateUrlSafely]);

  // Get current step field errors
  const getCurrentStepErrors = useCallback(() => {
    if (currentStep < 0 || currentStep >= STEP_FIELD_MAPPINGS.length) {
      return {};
    }

    const stepFields = STEP_FIELD_MAPPINGS[currentStep];
    const formErrors = form.formState.errors;
    const stepErrors = {};

    stepFields.forEach((field) => {
      if (formErrors[field as keyof CarListingFormData]) {
        stepErrors[field] = formErrors[field as keyof CarListingFormData];
      }
    });

    return stepErrors;
  }, [currentStep, form.formState.errors]);

  const hasStepErrors = useCallback(() => {
    const errors = getCurrentStepErrors();
    return Object.keys(errors).length > 0;
  }, [getCurrentStepErrors]);

  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const setStepCount = useCallback((count: number) => {
    setTotalSteps(count);
  }, []);

  return {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPrevStep,
    goToStep,
    setStepCount,
    hasStepErrors,
    getCurrentStepErrors,
  };
};
