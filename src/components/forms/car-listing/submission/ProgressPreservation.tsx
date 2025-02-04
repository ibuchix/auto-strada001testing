import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export const ProgressPreservation = () => {
  const { watch, setValue } = useFormContext<CarListingFormData>();
  const formData = watch();
  const { session } = useAuth();

  // Save progress to both localStorage and backend
  useEffect(() => {
    const saveProgress = async () => {
      // Save to localStorage
      localStorage.setItem('formProgress', JSON.stringify(formData));

      // Save to backend if user is authenticated
      if (session?.user.id) {
        try {
          // Map form data to database schema
          const dbData = {
            seller_id: session.user.id,
            name: formData.name,
            address: formData.address,
            mobile_number: formData.mobileNumber,
            features: formData.features,
            is_damaged: formData.isDamaged,
            is_registered_in_poland: formData.isRegisteredInPoland,
            has_tool_pack: formData.hasToolPack,
            has_documentation: formData.hasDocumentation,
            is_selling_on_behalf: formData.isSellingOnBehalf,
            has_private_plate: formData.hasPrivatePlate,
            finance_amount: formData.financeAmount ? parseFloat(formData.financeAmount) : null,
            service_history_type: formData.serviceHistoryType,
            seller_notes: formData.sellerNotes,
            seat_material: formData.seatMaterial,
            number_of_keys: parseInt(formData.numberOfKeys),
            is_draft: true,
            last_saved: new Date().toISOString(),
            // Required fields from database schema
            price: 0, // Temporary value, will be updated with actual valuation
            title: "Draft Listing", // Temporary value, will be updated with actual car details
            vin: formData.vin || '', // Required field
            mileage: formData.mileage || 0 // Required field
          };

          const { error } = await supabase
            .from('cars')
            .upsert(dbData);

          if (error) {
            console.error('Error saving draft:', error);
            toast.error("Failed to save draft", {
              description: "Your progress is saved locally but not synced to the cloud.",
              duration: 3000
            });
          }
        } catch (error) {
          console.error('Error saving draft:', error);
        }
      }
    };

    // Save progress every 30 seconds
    const intervalId = setInterval(saveProgress, 30000);

    // Save on unmount
    return () => {
      clearInterval(intervalId);
      saveProgress();
    };
  }, [formData, session?.user.id]);

  // Restore progress on mount
  useEffect(() => {
    const restoreProgress = async () => {
      // First try to restore from backend if user is authenticated
      if (session?.user.id) {
        try {
          const { data: draftData, error } = await supabase
            .from('cars')
            .select('*')
            .eq('seller_id', session.user.id)
            .eq('is_draft', true)
            .maybeSingle();

          if (!error && draftData) {
            // Map database fields back to form fields
            const formValues = {
              name: draftData.name,
              address: draftData.address,
              mobileNumber: draftData.mobile_number,
              features: draftData.features,
              isDamaged: draftData.is_damaged,
              isRegisteredInPoland: draftData.is_registered_in_poland,
              hasToolPack: draftData.has_tool_pack,
              hasDocumentation: draftData.has_documentation,
              isSellingOnBehalf: draftData.is_selling_on_behalf,
              hasPrivatePlate: draftData.has_private_plate,
              financeAmount: draftData.finance_amount?.toString(),
              serviceHistoryType: draftData.service_history_type,
              sellerNotes: draftData.seller_notes,
              seatMaterial: draftData.seat_material,
              numberOfKeys: draftData.number_of_keys?.toString(),
              vin: draftData.vin,
              mileage: draftData.mileage
            };

            Object.entries(formValues).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                setValue(key as keyof CarListingFormData, value as any, {
                  shouldValidate: false,
                  shouldDirty: false
                });
              }
            });
            return;
          }
        } catch (error) {
          console.error('Error restoring draft:', error);
        }
      }

      // Fallback to localStorage if no backend data or not authenticated
      const savedProgress = localStorage.getItem('formProgress');
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          Object.entries(parsed).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              setValue(key as keyof CarListingFormData, value as any, {
                shouldValidate: false,
                shouldDirty: false
              });
            }
          });
        } catch (error) {
          console.error('Error restoring form progress:', error);
          toast.error("Failed to restore saved progress", {
            description: "Please check if all fields are filled correctly.",
            duration: 5000
          });
        }
      }
    };

    restoreProgress();
  }, [setValue, session?.user.id]);

  return null;
};