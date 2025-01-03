import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { transformObjectToSnakeCase } from "@/utils/dataTransformers";

export const useFormSubmission = (userId?: string) => {
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();

  const prepareCarData = (data: CarListingFormData, valuationData: any) => {
    if (!valuationData.make || !valuationData.model || !valuationData.vin || !valuationData.mileage || !valuationData.valuation || !valuationData.year) {
      throw new Error("Please complete the vehicle valuation first");
    }

    if (!userId) {
      throw new Error("User must be logged in to save car information");
    }

    const title = `${valuationData.make} ${valuationData.model} ${valuationData.year}`.trim();
    if (!title) {
      throw new Error("Unable to generate listing title");
    }

    return transformObjectToSnakeCase({
      sellerId: userId,
      title,
      vin: valuationData.vin,
      mileage: valuationData.mileage,
      price: valuationData.valuation,
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      name: data.name,
      address: data.address,
      mobileNumber: data.mobileNumber,
      isDamaged: data.isDamaged,
      isRegisteredInPoland: data.isRegisteredInPoland,
      features: data.features,
      seatMaterial: data.seatMaterial,
      numberOfKeys: parseInt(data.numberOfKeys),
      hasToolPack: data.hasToolPack,
      hasDocumentation: data.hasDocumentation,
      isSellingOnBehalf: data.isSellingOnBehalf,
      hasPrivatePlate: data.hasPrivatePlate,
      financeAmount: data.financeAmount ? parseFloat(data.financeAmount) : null,
      serviceHistoryType: data.serviceHistoryType,
      sellerNotes: data.sellerNotes,
      isDraft: false,
      valuationData: valuationData,
      transmission: valuationData.transmission || null
    });
  };

  const handleSubmit = async (data: CarListingFormData) => {
    if (!userId) {
      toast.error("Please sign in to submit a listing");
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    try {
      const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
      const carData = prepareCarData(data, valuationData);

      const { error } = await supabase
        .from('cars')
        .insert(carData)
        .select()
        .single();

      if (error) throw error;

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