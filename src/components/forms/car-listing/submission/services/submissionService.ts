
/**
 * Car Listing Submission Service
 * Created: 2025-05-20
 * Updated: 2025-05-30 - Added error handling for last_saved field and improved error logging
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { prepareSubmission } from "../utils/submission";

/**
 * Submit a car listing to the database
 */
export const submitCarListing = async (
  formData: CarListingFormData,
  userId?: string
): Promise<{ id: string }> => {
  try {
    console.log("Submitting car listing to database:", { 
      formData: { ...formData, id: formData.id || 'new' },
      hasUserId: !!userId
    });
    
    // Prepare data for submission - this filters out frontend-only fields
    const preparedData = prepareSubmission(formData);
    
    // If editing (id exists), update the existing record
    if (preparedData.id) {
      const { data, error } = await supabase
        .from('cars')
        .update({
          ...preparedData,
          updated_at: new Date().toISOString(),
          seller_id: userId || preparedData.seller_id
        })
        .eq('id', preparedData.id)
        .select('id')
        .single();
      
      if (error) {
        console.error("Error updating car in database:", error);
        throw error;
      }
      
      console.log("Successfully updated car:", data);
      return { id: data.id };
    } else {
      // Creating a new listing
      const { data, error } = await supabase
        .from('cars')
        .insert({
          ...preparedData,
          seller_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        console.error("Error inserting car in database:", error);
        throw error;
      }
      
      console.log("Successfully created new car:", data);
      return { id: data.id };
    }
  } catch (error) {
    console.error("Error in submitCarListing:", error);
    throw error;
  }
};

/**
 * Fallback function for creating car listings when RPC is not available
 */
export const createCarUsingRPC = async (formData: CarListingFormData, userId: string): Promise<{ id: string }> => {
  try {
    const preparedData = prepareSubmission(formData);
    
    // Use create_car_listing RPC function if available
    const { data, error } = await supabase
      .rpc('create_car_listing', {
        p_car_data: preparedData,
        p_user_id: userId
      });
      
    if (error) {
      console.error("Error using create_car_listing RPC:", error);
      // Fallback to regular insert
      return submitCarListing(formData, userId);
    }
    
    console.log("Successfully created car using RPC:", data);
    return { id: data.car_id };
  } catch (error) {
    console.error("Error in createCarUsingRPC:", error);
    // Fallback to regular insert
    return submitCarListing(formData, userId);
  }
};

export default {
  submitCarListing,
  createCarUsingRPC
};
