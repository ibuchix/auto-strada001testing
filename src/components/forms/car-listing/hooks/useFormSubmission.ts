import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";

export const useFormSubmission = (userId?: string) => {
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: CarListingFormData) => {
    console.log('Form submission started with data:', data);
    
    try {
      setSubmitting(true);
      
      if (!userId) {
        toast.error("Please sign in to submit a listing");
        return;
      }

      const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
      if (!valuationData.make || !valuationData.model || !valuationData.vin || !valuationData.mileage || !valuationData.valuation) {
        toast.error("Please complete the vehicle valuation first");
        return;
      }

      const requiredFields = {
        name: data.name,
        address: data.address,
        mobileNumber: data.mobileNumber,
        serviceHistoryType: data.serviceHistoryType,
        seatMaterial: data.seatMaterial,
        numberOfKeys: data.numberOfKeys,
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      const uploadedPhotos = data.uploadedPhotos || [];
      if (uploadedPhotos.length === 0) {
        toast.error("Please upload at least one photo");
        return;
      }

      console.log('Preparing car data for submission...');

      const { error: insertError } = await supabase
        .from('cars')
        .insert({
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
          is_draft: false,
          required_photos: data.uploadedPhotos
        });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw insertError;
      }

      console.log('Car listing submitted successfully');
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