/**
 * Form Submission Provider
 * Created: 2025-07-23
 * Updated: 2025-07-24 - Fixed export of useFormSubmission hook
 * Updated: 2025-05-06 - Improved integration with FormDataContext
 * Updated: 2025-05-13 - Added validation for userId to prevent TypeScript errors
 * Updated: 2025-05-16 - Implemented proper form submission using listingService
 * Updated: 2025-05-04 - Enhanced logging and VIN reservation error handling
 * Updated: 2025-05-10 - Added fallback mechanism for missing VIN reservations
 * Updated: 2025-05-17 - Improved handling of temporary UUID-based VIN reservation IDs
 * Updated: 2025-05-17 - Fixed permission denied errors with security definer functions
 * Updated: 2025-05-06 - Refactored to use separate reservation recovery service
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SubmissionError } from './errors';
import { CarListingFormData } from "@/types/forms";
import { useFormData } from '../context/FormDataContext';
import { toast } from 'sonner';
import { createCarListing } from '@/services/listingService';
import { prepareSubmission } from './utils/submission';
import { recoverVinReservation } from '@/services/reservationRecoveryService';

// Define the submission context state
interface FormSubmissionState {
  isSubmitting: boolean;
  isSuccessful: boolean;
  error: SubmissionError | null;
  submittedCarId: string | null;
  lastSubmitAttempt: Date | null;
}

// Define the submission context
interface FormSubmissionContextType {
  submissionState: FormSubmissionState;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitSuccess: (carId: string) => void;
  setSubmitError: (error: SubmissionError | Error | string | null) => void;
  resetSubmissionState: () => void;
  submitForm: (formData: CarListingFormData) => Promise<string | null>;
  userId: string;
}

// Create the context with default value
export const FormSubmissionContext = createContext<FormSubmissionContextType | undefined>(undefined);

// Default submission state
const defaultSubmissionState: FormSubmissionState = {
  isSubmitting: false,
  isSuccessful: false,
  error: null,
  submittedCarId: null,
  lastSubmitAttempt: null
};

// Provider component
export const FormSubmissionProvider = ({ 
  children,
  userId
}: { 
  children: ReactNode,
  userId: string
}) => {
  // Validate userId to prevent errors
  if (!userId) {
    console.error("FormSubmissionProvider: userId is required but was not provided");
    throw new Error("FormSubmissionProvider requires a valid userId");
  }
  
  // State for submission
  const [submissionState, setSubmissionState] = useState<FormSubmissionState>(defaultSubmissionState);
  
  // Set submitting state
  const setSubmitting = (isSubmitting: boolean) => {
    setSubmissionState(prev => ({
      ...prev,
      isSubmitting,
      lastSubmitAttempt: isSubmitting ? new Date() : prev.lastSubmitAttempt
    }));
  };
  
  // Set submission success
  const setSubmitSuccess = (carId: string) => {
    setSubmissionState({
      isSubmitting: false,
      isSuccessful: true,
      error: null,
      submittedCarId: carId,
      lastSubmitAttempt: new Date()
    });
  };
  
  // Set submission error
  const setSubmitError = (error: SubmissionError | Error | string | null) => {
    let submissionError: SubmissionError | null = null;
    
    if (error) {
      if (error instanceof SubmissionError) {
        submissionError = error;
      } else if (error instanceof Error) {
        submissionError = new SubmissionError(error.message);
      } else {
        submissionError = new SubmissionError(String(error));
      }
    }
    
    setSubmissionState(prev => ({
      ...prev,
      isSubmitting: false,
      isSuccessful: false,
      error: submissionError
    }));
  };
  
  // Reset submission state
  const resetSubmissionState = () => {
    setSubmissionState(defaultSubmissionState);
  };
  
  // Submit form implementation using the edge function through listingService
  const submitForm = async (formData: CarListingFormData): Promise<string | null> => {
    try {
      setSubmitting(true);
      console.log('Submitting form data:', formData);
      
      // Check for VIN reservation ID
      let reservationId = localStorage.getItem('vinReservationId');
      const vin = formData.vin || localStorage.getItem('tempReservedVin');
      
      if (!reservationId && vin) {
        // No VIN reservation found but we have a VIN
        console.warn('No VIN reservation ID found in localStorage. Attempting to recover...');
        
        // Get valuation data from the form or localStorage
        let valuationData = formData.valuation_data;
        if (!valuationData) {
          const storedValuationData = localStorage.getItem('valuationData');
          if (storedValuationData) {
            try {
              valuationData = JSON.parse(storedValuationData);
              console.log('Using valuation data from localStorage:', valuationData);
            } catch (e) {
              console.error('Failed to parse stored valuation data:', e);
            }
          }
        }
        
        // Try to recover or create a new reservation using our extracted service
        reservationId = await recoverVinReservation(vin, userId, valuationData);
        
        if (!reservationId) {
          console.error('Failed to create VIN reservation');
          throw new Error("No valid VIN reservation found. Please complete a VIN check first.");
        }
        
        console.log(`Created recovery VIN reservation ID: ${reservationId}`);
        toast.info('Created a new VIN reservation', {
          description: 'Proceeding with form submission.'
        });
      } else if (!reservationId) {
        console.error('No VIN reservation ID found and no VIN provided');
        throw new Error("No valid VIN reservation found. Please complete a VIN check first.");
      }
      
      console.log(`Found VIN reservation ID: ${reservationId}`);
      
      // Prepare necessary data from the form
      const mileage = Number(formData.mileage);
      const transmission = formData.transmission as string;
      
      // Get valuation data from the form or localStorage
      let valuationData = formData.valuation_data;
      if (!valuationData) {
        // Try to get valuation data from localStorage as a fallback
        const storedValuationData = localStorage.getItem('valuationData');
        if (storedValuationData) {
          try {
            valuationData = JSON.parse(storedValuationData);
            console.log('Using valuation data from localStorage:', valuationData);
          } catch (e) {
            console.error('Failed to parse stored valuation data:', e);
          }
        }
      }
      
      if (!valuationData) {
        console.error('No valuation data found');
        throw new Error("Missing valuation data. Please complete a valuation first.");
      }
      
      if (!vin) {
        console.error('No VIN provided');
        throw new Error("VIN is required for car listing submission.");
      }
      
      // Log all data before submission
      console.log('Submitting with data:', {
        valuationData,
        userId,
        vin,
        mileage,
        transmission,
        reservationId
      });
      
      // Call the edge function through the service
      const result = await createCarListing(
        valuationData,
        userId,
        vin,
        mileage,
        transmission
      );
      
      if (!result) {
        throw new Error('Submission failed - no result returned from service');
      }
      
      const carId = result.car_id || result.id;
      
      if (!carId) {
        throw new Error('Submission failed - no car ID returned');
      }
      
      // Show success notification
      toast.success('Your car listing has been submitted successfully!');
      setSubmitSuccess(carId);
      
      // Return the car ID
      return carId;
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      setSubmitError(error);
      toast.error('Failed to submit car listing', {
        description: error.message || 'An unknown error occurred',
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <FormSubmissionContext.Provider value={{
      submissionState,
      setSubmitting,
      setSubmitSuccess,
      setSubmitError,
      resetSubmissionState,
      submitForm,
      userId
    }}>
      {children}
    </FormSubmissionContext.Provider>
  );
};

// Hook for consuming components
export const useFormSubmission = () => {
  const context = useContext(FormSubmissionContext);
  
  if (context === undefined) {
    throw new Error('useFormSubmission must be used within a FormSubmissionProvider');
  }
  
  return context;
};

// Alias for backward compatibility
export const useFormSubmissionContext = useFormSubmission;
