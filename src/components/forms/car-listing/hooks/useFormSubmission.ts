import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { prepareCarData } from "../utils/carDataTransformer";
import { insertCarListing } from "../utils/supabaseQueries";

export const useFormSubmission = (userId?: string) => {
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: CarListingFormData) => {
    console.log('Starting form submission with data:', data);
    
    if (!userId) {
      console.error('No user ID provided');
      toast.error("Please sign in to submit a listing");
      return;
    }

    try {
      setSubmitting(true);
      console.log('Setting submitting state to true');

      // Get valuation data from localStorage
      const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
      console.log('Retrieved valuation data:', valuationData);

      const carData = prepareCarData(data, userId, valuationData);
      console.log('Prepared car data:', carData);

      await insertCarListing(carData);
      console.log('Car listing submitted successfully');
      
      toast.success("Listing submitted successfully!");
      setShowSuccessDialog(true);
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Failed to submit listing");
    } finally {
      console.log('Setting submitting state to false');
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