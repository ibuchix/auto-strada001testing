
/**
 * Form Submit Handler Component
 * Created: 2025-05-13
 * Updated: 2025-05-19 - Fixed upload verification integration and loading state management
 * 
 * This component handles form submission, including:
 * - VIN reservation validation and creation
 * - Image upload finalization
 * - Form data processing and submission
 * - Error handling and feedback
 */

import { useEffect, useState, useRef } from "react";
import { useFormData } from "../context/FormDataContext";
import { useFormSubmission } from "./FormSubmissionProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { recoverVinReservation } from "@/services/reservationRecoveryService";
// Import FormSubmitButton to use our enhanced version
import { FormSubmitButton } from "../FormSubmitButton";

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
  const [isFinalizingUploads, setIsFinalizingUploads] = useState(false);
  const globalUploaderRef = useRef<any>(null);
  
  // Check if we have valid userId before allowing submission
  const isSubmitDisabled = !userId || submissionState.isSubmitting || isCreatingReservation || isFinalizingUploads;
  
  // Connect to the global uploader on mount
  useEffect(() => {
    globalUploaderRef.current = (window as any).__tempFileUploadManager;
    
    // Log status of global uploader connection
    if (globalUploaderRef.current) {
      console.log('[FormSubmitHandler] Connected to global upload manager', globalUploaderRef.current);
    } else {
      console.warn('[FormSubmitHandler] Global upload manager not available');
    }
    
    // Set up periodic checks for the upload manager
    const checkInterval = setInterval(() => {
      const uploader = (window as any).__tempFileUploadManager;
      if (!globalUploaderRef.current && uploader) {
        console.log('[FormSubmitHandler] Found global upload manager during periodic check');
        globalUploaderRef.current = uploader;
      }
    }, 2000); // Check every 2 seconds
    
    return () => {
      clearInterval(checkInterval);
      globalUploaderRef.current = null;
    };
  }, []);
  
  // Verify and finalize all uploads before submission
  const verifyUploads = async (): Promise<boolean> => {
    // Re-acquire the reference each time to ensure we have the latest
    const uploader = (window as any).__tempFileUploadManager;
    globalUploaderRef.current = uploader;
    
    if (!uploader) {
      console.log("[FormSubmitHandler] No upload manager available");
      
      // Show warning toast but allow submission
      toast.warning('Upload manager not found', {
        description: 'Image uploads may not be included in your listing'
      });
      
      return true; // Continue with submission
    }
    
    try {
      console.log("[FormSubmitHandler] Verifying uploads before submission");
      
      // First check if uploads are complete
      if (uploader.checkUploadsComplete && typeof uploader.checkUploadsComplete === 'function') {
        const uploadsComplete = uploader.checkUploadsComplete();
        const pendingFileCount = uploader.pendingFileCount ? uploader.pendingFileCount() : 0;
        
        console.log("[FormSubmitHandler] Upload check results:", { 
          uploadsComplete, 
          pendingFileCount,
          carId 
        });
        
        if (!uploadsComplete && pendingFileCount > 0) {
          console.log('[FormSubmitHandler] Uploads still in progress, please wait');
          toast.warning('Files are still uploading', {
            description: `Please wait for ${pendingFileCount} file(s) to complete uploading`
          });
          return false;
        }
      }
      
      // If we have a carId, we can finalize any pending uploads
      if (carId && uploader.finalizeUploads && typeof uploader.finalizeUploads === 'function') {
        setIsFinalizingUploads(true);
        console.log(`[FormSubmitHandler] Finalizing uploads for car ${carId} before submission`);
        
        try {
          toast.info('Processing uploads', {
            description: 'Please wait while we finalize your images'
          });
          
          const results = await uploader.finalizeUploads(carId);
          console.log('[FormSubmitHandler] Upload finalization results:', results);
          
          if (Array.isArray(results) && results.length > 0) {
            toast.success(`Processed ${results.length} images`, {
              description: 'All images ready for submission'
            });
            
            // Add a small delay to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error('[FormSubmitHandler] Error finalizing uploads:', error);
          toast.error('Error processing images', {
            description: 'Some images may not be included in your listing'
          });
          // Continue with submission despite errors
        } finally {
          setIsFinalizingUploads(false);
        }
      } else if (!carId) {
        console.warn('[FormSubmitHandler] No carId available for finalizing uploads');
      }
      
      return true;
    } catch (error) {
      console.error("[FormSubmitHandler] Error in upload verification:", error);
      setIsFinalizingUploads(false);
      
      toast.error('Upload verification error', {
        description: 'Proceeding with submission, but images may not be included'
      });
      
      return true; // Continue with submission despite errors
    }
  };
  
  // Ensure VIN reservation exists before submission
  const ensureVinReservation = async (values: any): Promise<boolean> => {
    try {
      // If there's already a VIN reservation ID in localStorage, we're good
      if (localStorage.getItem('vinReservationId')) {
        console.log('[FormSubmitHandler] VIN reservation exists in localStorage - good to proceed');
        return true;
      }
      
      // No VIN reservation yet - try to create one
      const vin = values.vin;
      
      if (!vin) {
        console.error("[FormSubmitHandler] No VIN available in form data");
        toast.error("Missing VIN", {
          description: "Please enter a valid VIN or perform a VIN lookup"
        });
        return false;
      }
      
      if (!userId) {
        console.error("[FormSubmitHandler] No user ID available");
        toast.error("Authentication required", {
          description: "Please log in to submit your listing"
        });
        return false;
      }
      
      // Try to get valuation data from localStorage or form
      let valuationData = values.valuation_data;
      if (!valuationData) {
        const storedData = localStorage.getItem('valuationData');
        if (storedData) {
          try {
            valuationData = JSON.parse(storedData);
          } catch (e) {
            console.error('[FormSubmitHandler] Error parsing stored valuation data:', e);
          }
        }
      }
      
      // Try to create a VIN reservation using our recovery service
      console.log('[FormSubmitHandler] Creating VIN reservation before submission:', vin);
      setIsCreatingReservation(true);
      
      const reservationId = await recoverVinReservation(vin, userId, valuationData);
      
      if (!reservationId) {
        toast.warning("VIN reservation incomplete", {
          description: "Proceeding with submission, but it may be delayed or fail."
        });
      } else {
        console.log(`[FormSubmitHandler] Successfully created/recovered reservation ID: ${reservationId}`);
      }
      
      return true;
    } catch (error) {
      console.error("[FormSubmitHandler] Error creating VIN reservation:", error);
      toast.error("Failed to reserve VIN", {
        description: "Please try again or contact support."
      });
      return false;
    } finally {
      setIsCreatingReservation(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Cannot submit form", {
        description: "User ID is not available. Please try refreshing the page."
      });
      return;
    }
    
    try {
      const values = form.getValues();
      
      // Validate required fields before submitting
      const requiredFields = ['make', 'model', 'year', 'mileage', 'vin'];
      const missingFields = requiredFields.filter(field => !values[field]);
      
      if (missingFields.length > 0) {
        toast.error("Missing required information", {
          description: `Please fill in: ${missingFields.join(', ')}`
        });
        return;
      }
      
      // Verify and ensure VIN reservation exists
      const reservationCreated = await ensureVinReservation(values);
      if (!reservationCreated) {
        return;
      }
      
      console.log(`[FormSubmitHandler] Form submission starting with VIN reservation: ${localStorage.getItem('vinReservationId')}`);
      
      // Add the user ID to the form data to satisfy RLS policies
      values.seller_id = userId;
      
      // Ensure vin is uppercase for consistency
      if (values.vin) {
        values.vin = values.vin.toUpperCase();
      }
      
      // Submit the form
      const result = await submitForm(values);
      
      if (result && onSubmitSuccess) {
        console.log(`[FormSubmitHandler] Form submitted successfully with car ID: ${result}`);
        
        // Clear the VIN reservation ID since it's been used successfully
        localStorage.removeItem('vinReservationId');
        localStorage.removeItem('tempReservedVin');
        
        // Show a confirmation toast
        toast.success('Listing submitted successfully!', {
          description: 'Your car listing has been submitted for review.'
        });
        
        onSubmitSuccess(result);
      }
    } catch (error) {
      console.error("[FormSubmitHandler] Error submitting form:", error);
      
      // Add detailed error logging
      if (error instanceof Error) {
        console.error(`[FormSubmitHandler] Error name: ${error.name}`);
        console.error(`[FormSubmitHandler] Error message: ${error.message}`);
        console.error(`[FormSubmitHandler] Error stack: ${error.stack}`);
      }
      
      // Special handling for cross-origin error 
      // (happens when using in iframes, doesn't affect functionality)
      if (error instanceof DOMException && error.name === "SecurityError") {
        console.warn("[FormSubmitHandler] Suppressing cross-origin error - does not affect functionality");
      } else {
        // Check if it's a VIN reservation issue
        if (error instanceof Error && error.message.includes('VIN reservation')) {
          toast.error("VIN reservation issue", {
            description: "Please perform a VIN Lookup in the Vehicle Details section to validate your VIN."
          });
        } else {
          toast.error("Form submission failed", {
            description: error instanceof Error ? error.message : "An unknown error occurred"
          });
        }
        
        if (onSubmitError && error instanceof Error) {
          onSubmitError(error);
        }
      }
    }
  };
  
  // Reset submission state when component unmounts
  useEffect(() => {
    return () => {
      resetSubmissionState();
    };
  }, [resetSubmissionState]);
  
  return (
    <div className="flex flex-col gap-4">
      {submissionState.error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          <p>Error: {submissionState.error.message}</p>
        </div>
      )}
      
      <FormSubmitButton 
        onSubmitClick={handleSubmit} 
        isSubmitting={submissionState.isSubmitting || isCreatingReservation || isFinalizingUploads}
        disabled={isSubmitDisabled}
        className={`${isSubmitDisabled ? "opacity-70" : ""} bg-[#DC143C] hover:bg-[#DC143C]/90`}
        onVerifyUploads={verifyUploads}
        formId="car-listing-form"
      >
        Submit Listing
      </FormSubmitButton>
      
      {submissionState.isSuccessful && (
        <div className="bg-green-50 text-green-800 p-4 rounded-md">
          <p>Car listing submitted successfully!</p>
        </div>
      )}
    </div>
  );
};
