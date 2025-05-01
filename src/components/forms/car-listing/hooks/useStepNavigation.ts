
/**
 * Changes made:
 * - 2025-06-01: Fixed unsafe postMessage calls and added safety checks
 * - 2025-06-01: Added error handling for cross-origin communication
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

  // Update URL when step changes
  useEffect(() => {
    try {
      // Update URL without refreshing page
      const url = new URL(window.location.href);
      url.searchParams.set("step", currentStep.toString());
      window.history.replaceState({}, '', url.toString());
      
      // Notify parent frame safely
      safePostMessage({ type: 'step-change', step: currentStep });
    } catch (error) {
      console.error("Error updating URL with step:", error);
    }
  }, [currentStep, safePostMessage]);

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
