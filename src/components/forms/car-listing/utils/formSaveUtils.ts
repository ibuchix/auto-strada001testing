import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SAVE_TIMEOUT } from "../constants";
import { prepareCarData } from "./carDataTransformer";
import { PostgrestError } from "@supabase/supabase-js";

export const saveFormData = async (
  formData: CarListingFormData,
  userId: string,
  valuationData: any,
  carId?: string
): Promise<void> => {
  try {
    const carData = prepareCarData(formData, valuationData, userId);
    
    // Only include carId in the upsert if it's defined
    const dataToUpsert = carId ? { ...carData, id: carId } : carData;

    const savePromise = supabase
      .from('cars')
      .upsert(dataToUpsert)
      .select();

    const timeoutPromise = new Promise<{ error: PostgrestError }>((_, reject) => {
      setTimeout(() => reject(new Error('Save operation timed out')), SAVE_TIMEOUT);
    });

    const result = await Promise.race([savePromise, timeoutPromise]);

    if (result.error) throw result.error;
  } catch (error: any) {
    console.error('Save error:', error);
    toast.error(error.message || 'Failed to save changes');
    throw error;
  }
};