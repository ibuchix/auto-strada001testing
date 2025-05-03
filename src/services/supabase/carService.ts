
/**
 * Car Service for handling car listing operations
 * Created: 2025-07-10
 */

import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";

/**
 * Saves a new car listing to the database
 */
export const saveCarListing = async (
  carData: CarListingFormData,
  userId: string
): Promise<{ id: string }> => {
  const { data, error } = await supabase
    .from('car_listings')
    .insert({
      ...transformCarDataForStorage(carData),
      seller_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending'
    })
    .select('id')
    .single();

  if (error) {
    console.error("Error saving car listing:", error);
    throw new Error(`Failed to save car listing: ${error.message}`);
  }

  return { id: data.id };
};

/**
 * Updates an existing car listing in the database
 */
export const updateCarListing = async (
  id: string,
  carData: Partial<CarListingFormData>
): Promise<{ id: string }> => {
  const { data, error } = await supabase
    .from('car_listings')
    .update({
      ...transformCarDataForStorage(carData),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error("Error updating car listing:", error);
    throw new Error(`Failed to update car listing: ${error.message}`);
  }

  return { id: data.id };
};

/**
 * Helper function to transform car data for storage
 */
const transformCarDataForStorage = (carData: Partial<CarListingFormData>) => {
  // Perform any transformations needed before saving to the database
  const { id, ...dataWithoutId } = carData;
  
  return {
    ...dataWithoutId,
    // Add any transformations here
  };
};
