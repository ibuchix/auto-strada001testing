import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { handleFormSubmission } from "../utils/submission";
import { FormSubmissionResult } from "../types/submission";

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
      const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
      
      // Set a longer timeout of 120 seconds for the submission
      const submissionPromise = handleFormSubmission(
        data, 
        userId, 
        valuationData, 
        carId
      );

      const timeoutPromise = new Promise<FormSubmissionResult>((_, reject) => {
        setTimeout(() => reject(new Error('The submission is taking longer than expected. Please try again.')), 120000);
      });

      console.log('Awaiting submission result...');
      const result = await Promise.race([submissionPromise, timeoutPromise]);

      if (result.success) {
        console.log('Submission successful');
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
          toast.error(result.error || "Failed to submit listing");
        }
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      if (error.message === 'The submission is taking longer than expected. Please try again.') {
        toast.error("The submission timed out. Please try again with smaller image files or check your connection.", {
          duration: 6000
        });
      } else if (error.message === 'Please complete the vehicle valuation first') {
        toast.error("Please complete the vehicle valuation before submitting");
        navigate('/sellers');
      } else if (error.code === 'TIMEOUT_ERROR') {
        toast.error("The request timed out. Please check your connection and try again.", {
          duration: 6000
        });
      } else {
        toast.error(error.message || "Failed to submit listing. Please try again.");
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