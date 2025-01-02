import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

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

      // Convert features to a JSON-compatible object
      const features: Json = {
        satNav: data.features.satNav || false,
        panoramicRoof: data.features.panoramicRoof || false,
        reverseCamera: data.features.reverseCamera || false,
        heatedSeats: data.features.heatedSeats || false,
        upgradedSound: data.features.upgradedSound || false
      };

      // Explicitly define all fields we want to insert
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
        features,
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
        .insert(carData)
        .select(`
          id,
          seller_id,
          title,
          description,
          vin,
          mileage,
          price,
          status,
          make,
          model,
          year,
          valuation_data,
          is_damaged,
          is_registered_in_poland,
          features,
          seat_material,
          number_of_keys,
          has_tool_pack,
          has_documentation,
          is_selling_on_behalf,
          has_private_plate,
          finance_amount,
          service_history_type,
          seller_notes,
          required_photos,
          is_draft,
          name,
          address,
          mobile_number
        `)
        .single();

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