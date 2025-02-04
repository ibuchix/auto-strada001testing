import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { prepareCarData } from "./carDataTransformer";

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

    const { error } = await supabase
      .from('cars')
      .upsert(dataToUpsert)
      .select();

    if (error) throw error;
    
    console.log('Auto-save successful');
  } catch (error: any) {
    console.error('Save error:', error);
    toast.error(error.message || 'Failed to save changes');
    throw error;
  }
};