import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { handleFormSubmission } from "../utils/submission";
import { FormSubmissionResult } from "../types/submission";
import { supabase } from "@/integrations/supabase/client";

export const useFormSubmission = (userId?: string) => {
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: CarListingFormData, carId?: string) => {
    if (!userId) {
      toast.error("Please sign in to submit a listing");
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    try {
      console.log('Starting submission process...');
      const valuationData = localStorage.getItem('valuationData');
      
      if (!valuationData) {
        toast.error("Please complete the vehicle valuation first", {
          description: "Return to the seller's page to start the valuation process.",
          duration: 5000
        });
        navigate('/sellers');
        return;
      }

      const parsedValuationData = JSON.parse(valuationData);
      console.log('Parsed valuation data:', parsedValuationData);
      
      // Set a longer timeout of 180 seconds for the submission
      const submissionPromise = handleFormSubmission(
        data, 
        userId, 
        parsedValuationData, 
        carId
      );

      const timeoutPromise = new Promise<FormSubmissionResult>((_, reject) => {
        setTimeout(() => reject(new Error('The submission is taking longer than expected. Please try again.')), 180000);
      });

      console.log('Awaiting submission result...');
      const result = await Promise.race([submissionPromise, timeoutPromise]);

      if (result.success) {
        console.log('Submission successful');
        
        // Only update draft status if we have a valid carId
        if (carId) {
          const { error: updateError } = await supabase
            .from('cars')
            .update({ is_draft: false })
            .eq('id', carId)
            .single();

          if (updateError) {
            console.error('Error updating draft status:', updateError);
            throw updateError;
          }
        }

        setShowSuccessDialog(true);
        // Clear valuation data after successful submission
        localStorage.removeItem('valuationData');
        localStorage.removeItem('tempMileage');
        localStorage.removeItem('tempVIN');
        localStorage.removeItem('tempGearbox');
      } else {
        if (result.error?.includes("already been listed")) {
          toast.error(result.error, {
            description: "Please check the VIN number or contact support if you believe this is an error.",
            duration: 5000,
          });
        } else {
          toast.error(result.error || "Failed to submit listing", {
            description: "Please ensure all required information is complete.",
            duration: 5000
          });
        }
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      if (error.message === 'The submission is taking longer than expected. Please try again.') {
        toast.error("The submission is taking longer than expected. Try reducing the size of your images or check your connection.", {
          duration: 8000
        });
      } else if (error.message?.includes('vehicle valuation')) {
        toast.error("Please complete the vehicle valuation first", {
          description: "Return to the seller's page to start the valuation process.",
          duration: 5000
        });
        navigate('/sellers');
      } else if (error.code === 'TIMEOUT_ERROR') {
        toast.error("The request timed out. Please check your connection and try again.", {
          duration: 8000
        });
      } else {
        toast.error(error.message || "Failed to submit listing. Please try again.", {
          description: "If the problem persists, please contact support.",
          duration: 5000
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit,
    navigate
  };
};