
/**
 * Form Controller Hook
 * Created: 2025-06-15
 * Updated: 2025-06-21 - Fixed missing imports and type errors
 */

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CarListingFormData, defaultCarFeatures } from "@/types/forms";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Create a simple schema for validation
const carFormSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  mileage: z.number().optional(),
  vin: z.string().optional(),
  price: z.number().optional(),
  transmission: z.enum(["manual", "automatic", "semi-automatic"]).optional(),
});

export type CarFormSchema = z.infer<typeof carFormSchema>;

interface UseFormControllerOptions {
  carId?: string;
  userId?: string;
  initialData?: Partial<CarListingFormData>;
  onSubmitSuccess?: (carId: string) => void;
  onSubmitError?: (error: Error) => void;
}

export const useFormController = ({
  carId,
  userId,
  initialData = {},
  onSubmitSuccess,
  onSubmitError,
}: UseFormControllerOptions) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // Prepare default values
  const defaultValues = useMemo(() => {
    return {
      seller_id: userId,
      make: "",
      model: "",
      year: new Date().getFullYear(),
      mileage: 0,
      vin: "",
      price: 0,
      transmission: "manual" as const,
      features: defaultCarFeatures,
      isDamaged: false,
      isRegisteredInPoland: false,
      hasPrivatePlate: false,
      isSellingOnBehalf: false,
      hasServiceHistory: false,
      serviceHistoryType: "none" as const,
      sellerNotes: "",
      seatMaterial: "cloth" as const,
      numberOfKeys: "1",
      ...initialData,
      features: { ...defaultCarFeatures, ...(initialData.features || {}) }
    };
  }, [initialData, userId]);
  
  // Initialize form with React Hook Form
  const form = useForm<CarListingFormData>({
    resolver: zodResolver(carFormSchema),
    defaultValues,
  });
  
  // Load existing car data if editing
  useEffect(() => {
    if (!carId) return;
    
    const loadCarData = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', carId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Reset form with loaded data
          form.reset(data as CarListingFormData);
          
          // Set last saved date
          if (data.updated_at) {
            setLastSaved(new Date(data.updated_at));
          }
        }
      } catch (err: any) {
        setError(err);
        console.error("Error loading car data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCarData();
    
    // Check online status
    const handleOnlineStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [carId, form]);
  
  // Save form progress
  const saveProgress = async (): Promise<boolean> => {
    if (!userId) {
      console.error("Cannot save without a user ID");
      return false;
    }
    
    try {
      setIsSaving(true);
      
      const formValues = form.getValues();
      
      // Check we have bare minimum data
      if (!formValues.make && !formValues.model && !formValues.vin) {
        // Don't save if nothing substantive to save
        return false;
      }
      
      // Prepare data for saving
      const saveData = {
        ...formValues,
        seller_id: userId,
        updated_at: new Date(),
        is_draft: true,
        status: 'draft'
      };
      
      // If we have a car ID, update; otherwise insert
      if (carId) {
        const { error } = await supabase
          .from('cars')
          .update(saveData)
          .eq('id', carId);
          
        if (error) throw error;
      } else {
        // Add created_at for new records
        saveData.created_at = new Date();
        
        const { data, error } = await supabase
          .from('cars')
          .insert(saveData)
          .select('id')
          .single();
          
        if (error) throw error;
        
        // Update carId if we created a new record
        if (data?.id) {
          // This would need to be communicated back to the parent component
          if (onSubmitSuccess) {
            onSubmitSuccess(data.id);
          }
        }
      }
      
      // Update last saved timestamp
      setLastSaved(new Date());
      
      // Show success toast
      toast.success("Progress saved");
      
      return true;
    } catch (error: any) {
      console.error("Error saving progress:", error);
      
      // Show error toast
      toast.error("Failed to save progress", {
        description: error.message
      });
      
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Submit the form
  const submitForm = async () => {
    try {
      // Validate form
      const result = await form.trigger();
      
      if (!result) {
        toast.error("Please complete all required fields");
        return false;
      }
      
      const formValues = form.getValues();
      
      // Submit form data
      const { data, error } = await supabase
        .from('cars')
        .upsert({
          ...formValues,
          seller_id: userId,
          status: 'pending',
          updated_at: new Date(),
          created_at: formValues.created_at || new Date()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (!data) {
        throw new Error("No data returned from submission");
      }
      
      toast.success("Car listing submitted successfully!");
      
      if (onSubmitSuccess && data.id) {
        onSubmitSuccess(data.id);
      }
      
      return true;
    } catch (error: any) {
      console.error("Error submitting form:", error);
      
      toast.error("Failed to submit listing", {
        description: error.message
      });
      
      if (onSubmitError) {
        onSubmitError(error);
      }
      
      return false;
    }
  };
  
  // Fields to display in each step
  const visibleSections = useMemo(() => {
    return [
      "car-details",
      "price",
      "condition",
      "features",
      "additional-info",
      "description",
      "photos",
      "rim-photos",
      "damage"
    ];
  }, []);
  
  return {
    form,
    isLoading,
    isSaving,
    error,
    lastSaved,
    isOffline,
    saveProgress,
    submitForm,
    visibleSections
  };
};
