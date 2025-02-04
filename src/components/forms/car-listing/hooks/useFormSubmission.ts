import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";

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

      // First operation: Save basic data
      const basicData = {
        seller_id: userId,
        title: `${parsedValuationData.make} ${parsedValuationData.model} ${parsedValuationData.year}`,
        make: parsedValuationData.make,
        model: parsedValuationData.model,
        year: parsedValuationData.year,
        vin: parsedValuationData.vin,
        mileage: parseInt(localStorage.getItem('tempMileage') || '0'),
        price: parsedValuationData.valuation || parsedValuationData.averagePrice,
        transmission: parsedValuationData.transmission,
        valuation_data: parsedValuationData,
        is_draft: false
      };

      const { data: savedBasicData, error: basicError } = carId 
        ? await supabase
            .from('cars')
            .update(basicData)
            .eq('id', carId)
            .select()
            .single()
        : await supabase
            .from('cars')
            .insert(basicData)
            .select()
            .single();

      if (basicError) {
        console.error('Basic data error:', basicError);
        throw basicError;
      }

      const updatedCarId = carId || savedBasicData.id;

      // Second operation: Save additional details
      const additionalData = {
        name: data.name,
        address: data.address,
        mobile_number: data.mobileNumber,
        features: data.features,
        is_damaged: data.isDamaged,
        is_registered_in_poland: data.isRegisteredInPoland,
        has_tool_pack: data.hasToolPack,
        has_documentation: data.hasDocumentation,
        is_selling_on_behalf: data.isSellingOnBehalf,
        has_private_plate: data.hasPrivatePlate,
        finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
        service_history_type: data.serviceHistoryType,
        seller_notes: data.sellerNotes,
        seat_material: data.seatMaterial,
        number_of_keys: parseInt(data.numberOfKeys)
      };

      const { error: additionalError } = await supabase
        .from('cars')
        .update(additionalData)
        .eq('id', updatedCarId)
        .single();

      if (additionalError) {
        console.error('Additional data error:', additionalError);
        throw additionalError;
      }

      console.log('Form submission completed successfully');
      setShowSuccessDialog(true);
      
      // Clear valuation data after successful submission
      localStorage.removeItem('valuationData');
      localStorage.removeItem('tempMileage');
      localStorage.removeItem('tempVIN');
      localStorage.removeItem('tempGearbox');
      
    } catch (error: any) {
      console.error('Submission error:', error);
      
      if (error.message?.includes('vehicle valuation')) {
        toast.error("Please complete the vehicle valuation first");
        navigate('/sellers');
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