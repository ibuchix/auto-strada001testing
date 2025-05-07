
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
 */

import { useEffect, useState } from "react";
import { useFormData } from "../context/FormDataContext";
import { useFormSubmission } from "./FormSubmissionProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { recoverVinReservation } from "@/services/reservationRecoveryService";

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
  
  // Check if we have valid userId before allowing submission
  const isSubmitDisabled = !userId || submissionState.isSubmitting || isCreatingReservation;
  
  // Ensure VIN reservation exists before submission
  const ensureVinReservation = async (values: any): Promise<boolean> => {
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
    
    // Try to create a VIN reservation using our new recovery service
    console.log('Creating VIN reservation before submission:', vin);
    setIsCreatingReservation(true);
    
    try {
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
      
      // Ensure VIN reservation exists
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
  
  return (
    <div className="flex flex-col gap-4">
      {submissionState.error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          <p>Error: {submissionState.error.message}</p>
        </div>
      )}
      
      <Button 
        type="button" 
        onClick={handleSubmit} 
        disabled={isSubmitDisabled}
        className={`${submissionState.isSubmitting || isCreatingReservation ? "opacity-70" : ""} bg-[#DC143C] hover:bg-[#DC143C]/90`}
      >
        {submissionState.isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : isCreatingReservation ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing submission...
          </>
        ) : "Submit Listing"}
      </Button>
      
      {submissionState.isSuccessful && (
        <div className="bg-green-50 text-green-800 p-4 rounded-md">
          <p>Car listing submitted successfully!</p>
        </div>
      )}
    </div>
  );
};
