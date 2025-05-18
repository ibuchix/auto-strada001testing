
/**
 * Form Submit Handler Component
 * Created: 2025-05-13
 * Updated: 2025-05-16 - Enhanced error handling and improved UX feedback
 * Updated: 2025-05-04 - Added detailed error logging and VIN reservation checks
 * Updated: 2025-05-04 - Improved VIN reservation handling and error messaging
 * Updated: 2025-05-05 - Added automatic VIN reservation creation if missing
 * Updated: 2025-05-05 - Fixed VIN reservation handling to work with RLS policies
 * Updated: 2025-05-08 - Improved error handling for undefined responses
 * Updated: 2025-05-08 - Added additional checks and feedback for reservation process
 * Updated: 2025-05-09 - Fixed type error: using reservationId instead of id property
 * Updated: 2025-05-10 - Improved handling of duplicate VIN reservations
 * Updated: 2025-05-17 - Fixed temporary VIN reservation IDs to use proper UUIDs
 * Updated: 2025-05-17 - Added better cross-origin error suppression
 * Updated: 2025-05-17 - Improved permission handling with auth tokens
 * Updated: 2025-05-18 - Fixed permission issues with VIN reservation checks
 * Updated: 2025-05-24 - Added image upload finalization check before submission
 */

import { useEffect, useState, useContext, useRef } from "react";
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
  const temporaryUploaderRef = useRef<{ finalizeUploads?: (carId: string) => Promise<any> }>(null);
  
  // Check if we have valid userId before allowing submission
  const isSubmitDisabled = !userId || submissionState.isSubmitting || isCreatingReservation || isFinalizingUploads;
  
  // Add support for image upload finalization
  const registerUploader = (uploader: any) => {
    if (uploader && uploader.finalizeUploads) {
      temporaryUploaderRef.current = uploader;
    }
  };
  
  // Verify and finalize all uploads before submission
  const verifyUploads = async (): Promise<boolean> => {
    if (!temporaryUploaderRef.current || !temporaryUploaderRef.current.finalizeUploads) {
      console.log("No upload finalizer registered, proceeding with submission");
      return true; // No uploader registered, assume all is well
    }
    
    if (!carId) {
      console.error("Missing carId, cannot finalize uploads");
      toast.error("Missing car ID", {
        description: "Cannot process uploads without a car ID"
      });
      return false;
    }
    
    try {
      setIsFinalizingUploads(true);
      console.log(`Finalizing uploads for car ${carId}`);
      
      // Allow some time for any pending uploads to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const results = await temporaryUploaderRef.current.finalizeUploads(carId);
      
      console.log(`Upload finalization complete, results:`, results);
      
      if (Array.isArray(results) && results.length > 0) {
        toast.success(`${results.length} files processed successfully`, {
          description: "Your images are ready for submission"
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error finalizing uploads:", error);
      toast.error("Upload error", {
        description: "Failed to process some uploads. You may try again or proceed with available images."
      });
      return false;
    } finally {
      setIsFinalizingUploads(false);
    }
  };
  
  // Ensure VIN reservation exists before submission
  const ensureVinReservation = async (values: any): Promise<boolean> => {
    try {
      // If there's already a VIN reservation ID in localStorage, we're good
      if (localStorage.getItem('vinReservationId')) {
        console.log('VIN reservation exists in localStorage - good to proceed');
        return true;
      }
      
      // No VIN reservation yet - try to create one
      const vin = values.vin;
      
      if (!vin) {
        console.error("No VIN available in form data");
        toast.error("Missing VIN", {
          description: "Please enter a valid VIN or perform a VIN lookup"
        });
        return false;
      }
      
      if (!userId) {
        console.error("No user ID available");
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
            console.error('Error parsing stored valuation data:', e);
          }
        }
      }
      
      // Try to create a VIN reservation using our recovery service
      console.log('Creating VIN reservation before submission:', vin);
      setIsCreatingReservation(true);
      
      const reservationId = await recoverVinReservation(vin, userId, valuationData);
      
      if (!reservationId) {
        toast.warning("VIN reservation incomplete", {
          description: "Proceeding with submission, but it may be delayed or fail."
        });
      } else {
        console.log(`Successfully created/recovered reservation ID: ${reservationId}`);
      }
      
      return true;
    } catch (error) {
      console.error("Error creating VIN reservation:", error);
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
      
      // First, finalize any pending uploads
      await verifyUploads();
      
      // Then ensure VIN reservation exists
      const reservationCreated = await ensureVinReservation(values);
      if (!reservationCreated) {
        return;
      }
      
      console.log(`Form submission starting with VIN reservation: ${localStorage.getItem('vinReservationId')}`);
      
      // Add the user ID to the form data to satisfy RLS policies
      values.seller_id = userId;
      
      // Submit the form
      const result = await submitForm(values);
      
      if (result && onSubmitSuccess) {
        console.log(`Form submitted successfully with car ID: ${result}`);
        
        // Clear the VIN reservation ID since it's been used successfully
        localStorage.removeItem('vinReservationId');
        localStorage.removeItem('tempReservedVin');
        
        onSubmitSuccess(result);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      
      // Add detailed error logging
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      // Special handling for cross-origin error 
      // (happens when using in iframes, doesn't affect functionality)
      if (error instanceof DOMException && error.name === "SecurityError") {
        console.warn("Suppressing cross-origin error - does not affect functionality");
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
  
  // Register image uploader from context if available
  useEffect(() => {
    // This would be implemented to connect to any image uploaders in the form
    const uploadManager = (window as any).__tempFileUploadManager;
    if (uploadManager) {
      registerUploader(uploadManager);
    }
  }, []);
  
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
