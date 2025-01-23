import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { CarListingFormData } from "@/types/forms";

export const useManualValuationForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<CarListingFormData>({
    defaultValues: {
      name: "",
      address: "",
      mobileNumber: "",
      conditionRating: 3,
      features: {
        satNav: false,
        panoramicRoof: false,
        reverseCamera: false,
        heatedSeats: false,
        upgradedSound: false
      },
      isDamaged: false,
      isRegisteredInPoland: false,
      hasToolPack: false,
      hasDocumentation: false,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: "",
      financeDocument: null,
      serviceHistoryType: "none",
      sellerNotes: "",
      uploadedPhotos: [],
      seatMaterial: "cloth",
      numberOfKeys: "1",
      transmission: "manual"
    },
  });

  const onSubmit = async (data: CarListingFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("manual_valuations")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          vin: data.vin,
          make: data.make,
          model: data.model,
          year: data.year,
          transmission: data.transmission,
          engine_capacity: data.engineCapacity,
          mileage: data.mileage,
          registration_number: data.registrationNumber,
          condition_rating: data.conditionRating,
          accident_history: data.accidentHistory,
          previous_owners: data.previousOwners,
          features: data.features as Database['public']['Tables']['manual_valuations']['Insert']['features'],
          contact_email: data.contactEmail,
          contact_phone: data.mobileNumber,
          notes: data.notes,
          is_damaged: data.isDamaged,
          is_registered_in_poland: data.isRegisteredInPoland,
          seat_material: data.seatMaterial,
          number_of_keys: parseInt(data.numberOfKeys),
          has_tool_pack: data.hasToolPack,
          has_documentation: data.hasDocumentation,
          is_selling_on_behalf: data.isSellingOnBehalf,
          has_private_plate: data.hasPrivatePlate,
          finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
          service_history_type: data.serviceHistoryType,
          service_history_files: data.serviceHistoryFiles,
          seller_notes: data.sellerNotes,
          name: data.name,
          address: data.address,
          mobile_number: data.mobileNumber,
        });

      if (error) throw error;

      toast.success("Valuation request submitted successfully!");
      navigate("/dashboard/seller");
    } catch (error: any) {
      console.error("Error submitting valuation:", error);
      toast.error(error.message || "Failed to submit valuation request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    uploadProgress,
    setUploadProgress,
    onSubmit: form.handleSubmit(onSubmit),
  };
};