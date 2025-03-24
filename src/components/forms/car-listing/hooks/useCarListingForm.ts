
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form with validation
 * - 2024-03-19: Added auto-save integration
 * - 2024-03-19: Added draft loading functionality
 * - 2024-08-20: Integrated standardized error handling
 * - 2024-08-04: Updated to use seller_name field instead of name
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 * - 2025-06-02: Removed references to non-existent field hasDocumentation
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useFormPersistence } from "./useFormPersistence";
import { useLoadDraft } from "./useLoadDraft";
import { validateFormData } from "../utils/validation";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseErrorHandling } from "@/hooks/useSupabaseErrorHandling";

export const useCarListingForm = (userId?: string, draftId?: string) => {
  const [carId, setCarId] = useState<string | undefined>(draftId);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const { error, isLoading, handleSupabaseError, withErrorHandling } = useSupabaseErrorHandling();

  // Initialize form with default values
  const form = useForm<CarListingFormData>({
    defaultValues: {
      name: "",
      address: "",
      mobileNumber: "",
      features: {
        satNav: false,
        panoramicRoof: false,
        reverseCamera: false,
        heatedSeats: false,
        upgradedSound: false
      },
      isDamaged: false,
      damageReports: [],
      isRegisteredInPoland: false,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: "",
      serviceHistoryType: "none",
      uploadedPhotos: [],
      rimPhotosComplete: false,
      sellerNotes: "",
      seatMaterial: "cloth",
      numberOfKeys: "1"
    },
  });

  // Load draft if draftId is provided
  useLoadDraft(form, setCarId, setLastSaved, userId, draftId);

  // Setup form persistence
  useFormPersistence(form, userId, currentStep);

  // Update validation errors when form values change
  useEffect(() => {
    const subscription = form.watch((data) => {
      const errors = validateFormData(data);
      setValidationErrors(errors);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Load current step from localStorage if available
  useEffect(() => {
    const savedStep = localStorage.getItem('formCurrentStep');
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
  }, []);

  // Function to save progress manually
  const saveProgress = async () => {
    if (!userId) return;
    
    return await withErrorHandling(async () => {
      const formData = form.getValues();
      
      // Check if we're creating a new draft or updating an existing one
      const { data, error } = await supabase
        .from('cars')
        .upsert({
          id: carId,
          seller_id: userId,
          seller_name: formData.name, // Use seller_name instead of name
          address: formData.address,
          mobile_number: formData.mobileNumber,
          features: formData.features,
          is_damaged: formData.isDamaged,
          is_registered_in_poland: formData.isRegisteredInPoland,
          is_selling_on_behalf: formData.isSellingOnBehalf,
          has_private_plate: formData.hasPrivatePlate,
          finance_amount: formData.financeAmount ? parseFloat(formData.financeAmount) : null,
          service_history_type: formData.serviceHistoryType,
          seller_notes: formData.sellerNotes,
          seat_material: formData.seatMaterial,
          number_of_keys: formData.numberOfKeys ? parseInt(formData.numberOfKeys) : 1,
          additional_photos: formData.uploadedPhotos || [],
          is_draft: true,
          form_metadata: {
            current_step: currentStep
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update carId if this was a new draft
      if (!carId && data) {
        setCarId(data.id);
      }
      
      setLastSaved(new Date());
      return data;
    }, "Failed to save form progress");
  };

  return {
    form,
    carId,
    lastSaved,
    currentStep,
    setCurrentStep,
    validationErrors,
    saveProgress,
    error,
    isLoading
  };
};
