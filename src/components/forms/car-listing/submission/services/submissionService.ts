/**
 * Car Listing Submission Service
 * Created: 2025-05-20
 * Updated: 2025-05-30 - Added error handling for last_saved field and improved error logging
 * Updated: 2025-06-04 - Enhanced error handling with retry mechanism and direct database fallback
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
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
          updated_at: new Date().toISOString(),
          is_draft: false,
          status: 'available'
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
 * Create car listing using RPC function to bypass RLS restrictions
 */
export const createCarUsingRPC = async (formData: CarListingFormData, userId: string): Promise<{ id: string }> => {
  try {
    console.log("Creating car using RPC function...");
    const preparedData = prepareSubmission(formData);
    
    // Try to use create_car_listing RPC function with retry mechanism
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`RPC attempt ${attempt}/3: Calling create_car_listing...`);
        
        const { data, error } = await supabase
          .rpc('create_car_listing', {
            p_car_data: preparedData,
            p_user_id: userId
          });
          
        if (error) {
          console.error(`RPC attempt ${attempt}/3 failed:`, error);
          
          // If this is not the last attempt, wait before retrying
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          throw error;
        }
        
        console.log("Successfully created car using RPC:", data);
        return { id: data.car_id };
      } catch (retryError) {
        if (attempt === 3) throw retryError;
        // Otherwise continue to next attempt
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw new Error("Failed to create car listing after all retry attempts");
    
  } catch (error) {
    console.error("Error in createCarUsingRPC:", error);
    
    // Fallback to standard method if RPC fails
    console.log("Falling back to standard submission method");
    return submitCarListing(formData, userId);
  }
};

export default {
  submitCarListing,
  createCarUsingRPC
};
