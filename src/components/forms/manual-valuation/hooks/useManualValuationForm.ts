
/**
 * Changes made:
 * - 2024-03-20: Modified to use cars table instead of non-existent manual_valuations
 * - 2024-03-20: Updated field mappings to match database schema
 * - 2024-03-25: Fixed table references and field names
 * - 2024-03-26: Fixed TypeScript errors by using proper table references
 * - 2024-08-05: Added admin notification functionality when a manual valuation is submitted
 * - 2024-08-05: Updated to use seller_name instead of name to match database schema
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 */

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
      // Get current user
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        throw new Error("You must be logged in to submit a valuation request");
      }
      
      // Insert car record as draft with valuation data
      const { error, data: carData } = await supabase
        .from("cars")
        .insert({
          seller_id: user.id,
          is_draft: true,
          status: 'manual_valuation',
          title: `${data.make} ${data.model} ${data.year}`,
          make: data.make,
          model: data.model,
          year: parseInt(String(data.year), 10),
          transmission: data.transmission,
          price: 0, // Will be updated after valuation
          mileage: parseInt(String(data.mileage), 10),
          features: data.features,
          is_damaged: data.isDamaged,
          is_registered_in_poland: data.isRegisteredInPoland,
          seat_material: data.seatMaterial,
          number_of_keys: parseInt(data.numberOfKeys),
          has_documentation: data.hasDocumentation,
          is_selling_on_behalf: data.isSellingOnBehalf,
          has_private_plate: data.hasPrivatePlate,
          finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
          service_history_type: data.serviceHistoryType,
          seller_notes: data.sellerNotes,
          seller_name: data.name, // Use seller_name instead of name
          address: data.address,
          mobile_number: data.mobileNumber,
          valuation_data: {
            vin: data.vin,
            condition_rating: data.conditionRating,
            notes: data.notes,
            registrationNumber: data.registrationNumber,
            contactEmail: data.contactEmail,
            previousOwners: data.previousOwners,
            accidentHistory: data.accidentHistory,
            engineCapacity: data.engineCapacity
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to admins and confirmation to user
      try {
        await supabase.functions.invoke('send-valuation-notification', {
          body: {
            userEmail: user.email,
            vehicleDetails: {
              make: data.make,
              model: data.model,
              year: data.year,
              vin: data.vin
            }
          }
        });
        
        console.log("Valuation notification sent successfully");
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
        // Continue despite notification error
      }

      toast.success("Valuation request submitted successfully!", {
        description: "We'll review your request and get back to you within 24-48 hours."
      });
      
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
