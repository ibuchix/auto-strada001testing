import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { prepareCarData } from "../utils/carDataTransformer";
import { supabase } from "@/integrations/supabase/client";

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

      // Get valuation data from localStorage
      const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
      console.log('Retrieved valuation data:', valuationData);

      if (!valuationData.make || !valuationData.model || !valuationData.year) {
        throw new Error('Missing required valuation data');
      }

      const carData = prepareCarData(data, userId, valuationData);
      console.log('Prepared car data:', carData);

      const { error } = await supabase
        .from('cars')
        .insert(carData)
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Form submitted successfully');
      toast.success("Listing submitted successfully!");
      setShowSuccessDialog(true);
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Failed to submit listing");
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