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
      const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
      const submissionPromise = handleFormSubmission(
        data, 
        userId, 
        valuationData, 
        carId
      );

      const timeoutPromise = new Promise<FormSubmissionResult>((_, reject) => {
        setTimeout(() => reject(new Error('The submission is taking longer than expected. Please try again.')), 30000);
      });

      const result = await Promise.race([submissionPromise, timeoutPromise]);

      if (result.success) {
        setShowSuccessDialog(true);
      } else {
        toast.error(result.error || "Failed to submit listing");
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      if (error.message === 'The submission is taking longer than expected. Please try again.') {
        toast.error("The submission timed out. Please try again with smaller image files or check your connection.");
      } else if (error.message === 'Please complete the vehicle valuation first') {
        toast.error("Please complete the vehicle valuation before submitting");
        navigate('/sellers');
      } else {
        toast.error(error.message || "Failed to submit listing");
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