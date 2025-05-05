
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
 */

import { useEffect, useState } from "react";
import { useFormData } from "../context/FormDataContext";
import { useFormSubmission } from "./FormSubmissionProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { reserveVin } from "@/services/vinReservationService";

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
    
    // Try to create a VIN reservation
    console.log('Creating VIN reservation before submission:', vin);
    setIsCreatingReservation(true);
    
    try {
      // Log the parameters being sent
      console.log('Calling reserveVin with:', { 
        vin, 
        userId, 
        valuationDataExists: !!valuationData 
      });
      
      const reservationResult = await reserveVin(vin, userId, valuationData);
      
      // Log the complete response for debugging
      console.log('VIN reservation result:', reservationResult);
      
      // Check for various success scenarios:
      
      // Case 1: Standard success with reservationId in data
      if (reservationResult.success && reservationResult.data?.reservationId) {
        localStorage.setItem('vinReservationId', reservationResult.data.reservationId);
        console.log('VIN reservation created successfully:', reservationResult.data);
        return true;
      } 
      // Case 2: Data contains nested properties or different structure
      else if (reservationResult.success && reservationResult.data) {
        // Try to extract reservationId from different possible locations
        const possibleId = reservationResult.data.reservationId || 
                           reservationResult.data.reservation?.id ||
                           (typeof reservationResult.data === 'string' ? reservationResult.data : null);
        
        if (possibleId) {
          localStorage.setItem('vinReservationId', possibleId);
          console.log('VIN reservation ID extracted from alternative location:', possibleId);
          return true;
        }
        
        // Special handling for duplicate key errors - the VIN is already reserved
        // Check if this is a duplicate key error in the data
        if (reservationResult.data.error && reservationResult.data.error.includes('duplicate key')) {
          console.log('Duplicate VIN reservation detected - attempting to retrieve existing reservation');
          
          // Try to check for existing reservation
          try {
            // This is a duplicate key error but we need to get the existing reservation ID
            // Let's use a fallback approach - check VIN's reservation status
            const checkResult = await reserveVin(vin, userId, null);
            console.log('VIN check result:', checkResult);
            
            // Try to extract any reservation id from the check result
            if (checkResult.success && checkResult.data) {
              const existingId = checkResult.data.reservationId || 
                               checkResult.data.reservation?.id;
              
              if (existingId) {
                localStorage.setItem('vinReservationId', existingId);
                console.log('Retrieved existing VIN reservation:', existingId);
                toast.success('Using existing VIN reservation', {
                  description: 'Your VIN was already reserved. Proceeding with submission.'
                });
                return true;
              }
            }
            
            // If we get here, we need to handle the case where we know it's a duplicate
            // but couldn't get the ID - we'll create a temporary ID
            const tempId = `temp_${Date.now()}_${vin}`;
            localStorage.setItem('vinReservationId', tempId);
            console.log('Created temporary VIN reservation ID:', tempId);
            toast.warning('VIN reservation issue', {
              description: 'Using temporary VIN reservation. Submission may be delayed.'
            });
            return true;
          } catch (innerError) {
            console.error('Error handling duplicate reservation:', innerError);
          }
        }
        
        console.warn('Reservation success but no ID found in response:', reservationResult);
        toast.warning('VIN reservation incomplete', {
          description: 'Reserved but could not get confirmation ID. Proceeding anyway.'
        });
        return true; // Proceed anyway since the server reported success
      } else {
        console.error('Failed to create VIN reservation:', 
          reservationResult.error || 'No error message provided');
        
        toast.error('VIN reservation failed', {
          description: reservationResult.error || 'Unable to reserve this VIN. Please try again or perform a new VIN lookup.'
        });
        return false;
      }
    } catch (error) {
      console.error('Error creating VIN reservation:', error);
      
      // Log detailed information about the error object
      console.error('Error type:', typeof error);
      console.error('Error structure:', JSON.stringify(error, null, 2));
      
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          'An unknown error occurred';
                          
      toast.error('VIN reservation error', {
        description: errorMessage || 'An error occurred while reserving this VIN. Please try again.'
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
