import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

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
      
      if (!valuationData.make || !valuationData.model || !valuationData.vin || !valuationData.mileage || !valuationData.valuation) {
        console.error('Missing valuation data:', valuationData);
        toast.error("Please complete the vehicle valuation first");
        return;
      }

      // Prepare the car data
      const carData = {
        seller_id: userId,
        title: `${valuationData.make} ${valuationData.model} ${valuationData.year}`,
        vin: valuationData.vin,
        mileage: valuationData.mileage,
        price: valuationData.valuation,
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year,
        valuation_data: valuationData,
        name: data.name,
        address: data.address,
        mobile_number: data.mobileNumber,
        is_damaged: data.isDamaged,
        is_registered_in_poland: data.isRegisteredInPoland,
        features: JSON.stringify(data.features),
        seat_material: data.seatMaterial,
        number_of_keys: parseInt(data.numberOfKeys),
        has_tool_pack: data.hasToolPack,
        has_documentation: data.hasDocumentation,
        is_selling_on_behalf: data.isSellingOnBehalf,
        has_private_plate: data.hasPrivatePlate,
        finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
        service_history_type: data.serviceHistoryType,
        seller_notes: data.sellerNotes,
        required_photos: data.uploadedPhotos,
        is_draft: false
      };

      console.log('Submitting car data to Supabase:', carData);

      const { error } = await supabase
        .from('cars')
        .insert(carData);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

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