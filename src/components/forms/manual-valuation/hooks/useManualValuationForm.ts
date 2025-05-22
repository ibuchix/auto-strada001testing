
/**
 * Changes made:
 * - Updated to use manual_valuations table instead of cars table
 * - Fixed field mappings to match database schema
 * - Added proper validation and error handling
 * - Implemented admin notification via edge function
 * - Updated: 2025-06-22 - Fixed type conversions and field access
 * - Updated: 2025-05-05 - Fixed TypeScript errors with conditionRating and other fields
 * - Updated: 2025-05-06 - Improved type safety for serviceHistoryType and fixed type errors
 * - Updated: 2025-05-30 - Fixed type errors with numberOfKeys and field name references
 * - Updated: 2025-05-23 - Fixed TypeScript compatibility with Supabase Json types
 */

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";
import { toSupabaseObject } from "@/utils/supabaseTypeUtils";

export const useManualValuationForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<CarListingFormData & {
    conditionRating?: number;
    accidentHistory?: string;
    contactEmail?: string;
    previousOwners?: number;
    engineCapacity?: number;
    notes?: string;
  }>({
    defaultValues: {
      sellerName: "",
      address: "",
      mobileNumber: "",
      conditionRating: 3,
      features: {
        airConditioning: false,
        bluetooth: false,
        cruiseControl: false,
        leatherSeats: false,
        navigation: false,
        parkingSensors: false,
        sunroof: false,
        satNav: false,
        panoramicRoof: false,
        reverseCamera: false,
        heatedSeats: false,
        upgradedSound: false,
        alloyWheels: false
      },
      isDamaged: false,
      isRegisteredInPoland: false,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: 0,
      serviceHistoryType: "none" as "none" | "partial" | "full",
      sellerNotes: "",
      uploadedPhotos: [],
      seatMaterial: "cloth",
      numberOfKeys: 1,
      transmission: "manual" as "manual" | "automatic" | "semi-automatic"
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

  const onSubmit = async (data: CarListingFormData & {
    conditionRating?: number;
    accidentHistory?: string;
    contactEmail?: string;
    previousOwners?: number;
    engineCapacity?: number;
    notes?: string;
  }) => {
    setIsSubmitting(true);
    try {
      // Get current user
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        throw new Error("You must be logged in to submit a valuation request");
      }
      
      // Ensure serviceHistoryType is one of the allowed values
      const serviceHistoryType: "none" | "partial" | "full" = 
        (data.serviceHistoryType === "full" || data.serviceHistoryType === "partial") 
          ? data.serviceHistoryType 
          : "none";
      
      // Validate transmission value
      const transmission: "manual" | "automatic" | "semi-automatic" = 
        (data.transmission === "automatic" || data.transmission === "semi-automatic")
          ? data.transmission
          : "manual";
      
      // Convert data to Supabase compatible format
      const supabaseData = toSupabaseObject({
        user_id: user.id,
        name: data.sellerName,
        make: data.make,
        model: data.model,
        year: safeParseInt(data.year) || new Date().getFullYear(),
        transmission: transmission,
        mileage: safeParseInt(data.mileage) || 0,
        features: data.features,
        is_damaged: data.isDamaged,
        is_registered_in_poland: data.isRegisteredInPoland,
        seat_material: data.seatMaterial,
        number_of_keys: safeParseInt(data.numberOfKeys) || 1,
        is_selling_on_behalf: data.isSellingOnBehalf,
        has_private_plate: data.hasPrivatePlate,
        finance_amount: safeParseFloat(data.financeAmount),
        service_history_type: serviceHistoryType,
        seller_notes: data.sellerNotes,
        condition_rating: data.conditionRating || 3,
        address: data.address,
        mobile_number: data.mobileNumber,
        vin: data.vin,
        registration_number: data.registrationNumber,
        accident_history: data.accidentHistory || '',
        contact_email: data.contactEmail || '',
        previous_owners: safeParseInt(data.previousOwners) || null,
        engine_capacity: safeParseFloat(data.engineCapacity) || null,
        notes: data.notes || '',
        uploaded_photos: data.uploadedPhotos,
        status: 'pending'
      });

      // Insert into manual_valuations table
      const { error, data: valuationData } = await supabase
        .from("manual_valuations")
        .insert(supabaseData)
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
