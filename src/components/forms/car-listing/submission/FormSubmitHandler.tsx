
/**
 * Form Submit Handler Component
 * Created: 2025-05-13
 * Updated: 2025-05-19 - Fixed upload verification integration and loading state management
 * Updated: 2025-05-21 - Fixed temporary upload association during form submission
 * Updated: 2025-05-22 - Fixed TypeScript errors with result type definitions
 * Updated: 2025-05-23 - Improved type handling and consistency with return types
 * Updated: 2025-05-24 - Refactored for better consistency and type safety
 * 
 * This component handles form submission, including:
 * - VIN reservation validation and creation
 * - Image upload finalization
 * - Form data processing and submission
 * - Error handling and feedback
 */

import { useEffect, useState, useRef } from "react";
import { useFormData } from "../context/FormDataContext";
import { useFormSubmission } from "./FormSubmissisionProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FormSubmitHandlerProps {
  onSubmitSuccess?: (carId: string) => void;
  onSubmitError?: (error: Error) => void;
  carId?: string;
  userId?: string;
}

export const FormSubmitHandler = ({
  onSubmitSuccess,
  onSubmitError,
  carId,
  userId
}: FormSubmitHandlerProps) => {
  const { submissionState, submitForm, resetSubmissionState } = useFormSubmission();
  const { form } = useFormData();
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isVerifyingImages, setIsVerifyingImages] = useState(false);
  const tempSessionIdRef = useRef<string | null>(null);
  
  // Check for temp session ID immediately
  useEffect(() => {
    // Check for existing temp session ID
    tempSessionIdRef.current = localStorage.getItem('tempSessionId');
    if (tempSessionIdRef.current) {
      console.log(`[FormSubmitHandler] Found existing temp session ID: ${tempSessionIdRef.current}`);
    }
  }, []);
  
  // Check if we have valid userId before allowing submission
  const isSubmitDisabled = !userId || submissionState.isSubmitting || isCreatingReservation || isProcessingImages;
  
  // Handle form submission with proper image handling
  const handleSubmit = async () => {
    try {
      if (!userId) {
        toast.error('You must be logged in to submit a form');
        return;
      }

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
      
      // Submit the form
      const submittedCarId = await submitForm(form.getValues());
      
      if (submittedCarId) {
        // Clear any temporary image data from localStorage after successful submission
        if (localStorage.getItem('tempFileUploads')) {
          console.log('[FormSubmitHandler] Clearing temp file uploads after successful submission');
          localStorage.removeItem('tempFileUploads');
        }
        
        if (localStorage.getItem('tempSessionId')) {
          console.log('[FormSubmitHandler] Clearing temp session ID after successful submission');
          localStorage.removeItem('tempSessionId');
        }
        
        // Call onSubmitSuccess callback if provided
        if (onSubmitSuccess) {
          onSubmitSuccess(submittedCarId);
        }
      } else {
        // Call onSubmitError callback if provided
        if (onSubmitError) {
          onSubmitError(new Error('Submission failed - no car ID returned'));
        }
      }
    } catch (error) {
      console.error('[FormSubmitHandler] Form submission error:', error);
      
      if (onSubmitError) {
        onSubmitError(error instanceof Error ? error : new Error('Unknown error during submission'));
      }
      
      toast.error('Failed to submit form', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsProcessingImages(false);
    }
  };
  
  return (
    <div className="flex justify-end space-x-4 mt-6">
      <Button
        type="button"
        variant="default"
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className="min-w-[150px]"
      >
        {submissionState.isSubmitting || isProcessingImages ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isVerifyingImages ? 'Verifying Images...' : isProcessingImages ? 'Processing Images...' : 'Submitting...'}
          </>
        ) : (
          'Submit Listing'
        )}
      </Button>
    </div>
  );
};
