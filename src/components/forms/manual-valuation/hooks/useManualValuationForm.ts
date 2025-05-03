
/**
 * Changes made:
 * - Updated to use manual_valuations table instead of cars table
 * - Fixed field mappings to match database schema
 * - Added proper validation and error handling
 * - Implemented admin notification via edge function
 * - Updated: 2025-06-22 - Fixed type conversions and field access
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
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: 0,
      financeDocument: null,
      serviceHistoryType: "none",
      sellerNotes: "",
      uploadedPhotos: [],
      seatMaterial: "cloth",
      numberOfKeys: "1",
      transmission: "manual"
    },
  });

  // Helper for safe numeric parsing
  const safeParseInt = (value: string | number | undefined): number | null => {
    if (value === undefined || value === null || value === '') return null;
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? null : num;
  };

  const safeParseFloat = (value: string | number | undefined): number | null => {
    if (value === undefined || value === null || value === '') return null;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? null : num;
  };

  const onSubmit = async (data: CarListingFormData) => {
    setIsSubmitting(true);
    try {
      // Get current user
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        throw new Error("You must be logged in to submit a valuation request");
      }
      
      // Insert into manual_valuations table - targeting the correct table now
      const { error, data: valuationData } = await supabase
        .from("manual_valuations")
        .insert({
          user_id: user.id,
          name: data.name,
          make: data.make,
          model: data.model,
          year: safeParseInt(data.year) || new Date().getFullYear(),
          transmission: data.transmission,
          mileage: safeParseInt(data.mileage) || 0,
          features: data.features,
          is_damaged: data.isDamaged,
          is_registered_in_poland: data.isRegisteredInPoland,
          seat_material: data.seatMaterial,
          number_of_keys: safeParseInt(data.numberOfKeys) || 1,
          is_selling_on_behalf: data.isSellingOnBehalf,
          has_private_plate: data.hasPrivatePlate,
          finance_amount: safeParseFloat(data.financeAmount),
          service_history_type: data.serviceHistoryType,
          seller_notes: data.sellerNotes,
          condition_rating: data.conditionRating || 3,
          address: data.address,
          mobile_number: data.mobileNumber,
          vin: data.vin,
          registration_number: data.registration_number || data.registrationNumber,
          accident_history: data.accidentHistory || '',
          contact_email: data.contactEmail || '',
          previous_owners: safeParseInt(data.previousOwners) || null,
          engine_capacity: safeParseFloat(data.engineCapacity) || null,
          notes: data.notes || '',
          uploaded_photos: data.uploadedPhotos,
          status: 'pending'
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
