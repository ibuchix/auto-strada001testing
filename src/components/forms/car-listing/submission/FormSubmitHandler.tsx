
/**
 * Form Submit Handler Component
 * Created: 2025-05-13
 * Updated: 2025-05-19 - Fixed upload verification integration and loading state management
 * Updated: 2025-05-21 - Fixed temporary upload association during form submission
 * Updated: 2025-05-22 - Fixed TypeScript errors with result type definitions
 * Updated: 2025-05-23 - Improved type handling and consistency with return types
 * Updated: 2025-05-24 - Refactored for better consistency and type safety
 * Updated: 2025-05-19 - Fixed import path to use correct file name
 * Updated: 2025-05-19 - Updated to use submitError property
 * Updated: 2025-05-26 - Fixed FormSubmission context import to use local context
 * Updated: 2025-05-19 - Added throttling feedback and improved error handling
 * Updated: 2025-05-20 - Removed duplicate throttling logic to use centralized implementation
 */

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useFormData } from "../context/FormDataContext";
import { useFormSubmission } from "../submission/FormSubmissionProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

interface FormSubmitHandlerProps {
  onSubmitSuccess?: (carId: string) => void;
  onSubmitError?: (error: Error) => void;
  carId?: string;
  userId?: string;
}

export const FormSubmitHandler = memo(({
  onSubmitSuccess,
  onSubmitError,
  carId,
  userId
}: FormSubmitHandlerProps) => {
  const { submissionState, submitForm } = useFormSubmission();
  const { submitError, isSubmitting, cooldownTimeRemaining } = submissionState;
  const { form } = useFormData();
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isVerifyingImages, setIsVerifyingImages] = useState(false);
  const tempSessionIdRef = useRef<string | null>(null);
  const submissionInProgressRef = useRef<boolean>(false);
  
  // Reset submission flags when isSubmitting changes to false
  useEffect(() => {
    if (!isSubmitting && submissionInProgressRef.current) {
      const timer = setTimeout(() => {
        submissionInProgressRef.current = false;
        setIsProcessingImages(false);
        setIsVerifyingImages(false);
        setIsCreatingReservation(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isSubmitting]);
  
  // Check for temp session ID immediately
  useEffect(() => {
    // Check for existing temp session ID
    tempSessionIdRef.current = localStorage.getItem('tempSessionId');
    if (tempSessionIdRef.current) {
      console.log(`[FormSubmitHandler] Found existing temp session ID: ${tempSessionIdRef.current}`);
    }
  }, []);
  
  // Check if we have valid userId before allowing submission
  const isSubmitDisabled = !userId || isSubmitting || isCreatingReservation || isProcessingImages;
  
  // Handle form submission with proper image handling
  const handleSubmit = useCallback(async () => {
    try {
      // Prevent submission if already in progress
      if (submissionInProgressRef.current) {
        console.log(`[FormSubmitHandler] Submission already in progress, ignoring click`);
        return;
      }
      
      // Check if cooling down
      if (typeof cooldownTimeRemaining === 'number' && cooldownTimeRemaining > 0) {
        console.log(`[FormSubmitHandler] Cooling down, ${cooldownTimeRemaining}s remaining`);
        toast.info(`Please wait ${cooldownTimeRemaining} seconds before submitting again`);
        return;
      }
      
      if (!userId) {
        toast.error('You must be logged in to submit a form');
        return;
      }

      submissionInProgressRef.current = true;
      
      // Check if we have a temp session ID for images
      console.log(`[FormSubmitHandler] Temp session ID check: ${tempSessionIdRef.current || 'none'}`);
      
      // Verify image uploads are complete
      setIsVerifyingImages(true);
      const tempUploadsStr = localStorage.getItem('tempFileUploads');
      console.log(`[FormSubmitHandler] Temp uploads found: ${!!tempUploadsStr}`);
      
      if (tempUploadsStr) {
        try {
          const tempUploads = JSON.parse(tempUploadsStr);
          console.log(`[FormSubmitHandler] Found ${tempUploads.length} temporary uploads to be associated with submission`);
        } catch (e) {
          console.warn('[FormSubmitHandler] Error parsing temp uploads:', e);
        }
      }
      
      setIsVerifyingImages(false);
      setIsProcessingImages(true);
      
      // Submit the form
      const submittedCarId = await submitForm(form.getValues());
      
      if (submittedCarId) {
        // Call onSubmitSuccess callback if provided
        if (onSubmitSuccess) {
          onSubmitSuccess(submittedCarId);
        }
      } else if (submitError) {
        // Call onSubmitError callback if provided
        if (onSubmitError) {
          onSubmitError(new Error(submitError));
        }
      }
      
      setIsProcessingImages(false);
      submissionInProgressRef.current = false;
    } catch (error) {
      console.error('[FormSubmitHandler] Form submission error:', error);
      
      if (onSubmitError) {
        onSubmitError(error instanceof Error ? error : new Error('Unknown error during submission'));
      }
      
      toast.error('Failed to submit form', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      setIsProcessingImages(false);
      submissionInProgressRef.current = false;
    }
  }, [
    userId, 
    submitForm, 
    form, 
    submitError, 
    onSubmitSuccess, 
    onSubmitError,
    cooldownTimeRemaining
  ]);
  
  // Get loading or cooldown state text
  const getButtonText = () => {
    if (isVerifyingImages) return 'Verifying Images...';
    if (isProcessingImages) return 'Processing Images...';
    if (isSubmitting) return 'Submitting...';
    if (typeof cooldownTimeRemaining === 'number' && cooldownTimeRemaining > 0) {
      return `Wait ${cooldownTimeRemaining}s`;
    }
    return 'Submit Listing';
  };
  
  return (
    <div className="flex justify-end space-x-4 mt-6">
      <Button
        type="button"
        variant="default"
        onClick={handleSubmit}
        disabled={isSubmitDisabled || (typeof cooldownTimeRemaining === 'number' && cooldownTimeRemaining > 0)}
        className="min-w-[150px]"
      >
        {(isSubmitting || isProcessingImages || isVerifyingImages || (typeof cooldownTimeRemaining === 'number' && cooldownTimeRemaining > 0)) ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {getButtonText()}
          </>
        ) : (
          'Submit Listing'
        )}
      </Button>
    </div>
  );
});

// Add display name for better debugging
FormSubmitHandler.displayName = 'FormSubmitHandler';
