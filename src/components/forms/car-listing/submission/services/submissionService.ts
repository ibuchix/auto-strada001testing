
/**
 * Car Listing Submission Service
 * Updated: 2025-05-24 - COMPLETELY REMOVED ALL DRAFT LOGIC - All listings are immediately available
 * Updated: 2025-05-24 - Simplified to always create available listings
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { prepareSubmission } from "../utils/submission";
import { toSupabaseObject } from "@/utils/supabaseTypeUtils";

/**
 * Submit a car listing - ALWAYS immediately available
 */
export const submitCarListing = async (
  formData: CarListingFormData,
  userId?: string
): Promise<{ id: string }> => {
  try {
    console.log("Submitting IMMEDIATE car listing:", { 
      formData: { ...formData, id: formData.id || 'new' },
      hasUserId: !!userId
    });
    
    // Prepare data for submission
    const preparedData = prepareSubmission(formData);
    
    // Update existing or create new
    if (preparedData.id) {
      const supabaseData = toSupabaseObject({
        ...preparedData,
        updated_at: new Date().toISOString(),
        seller_id: userId || preparedData.seller_id,
        status: 'available', // ALWAYS available
        is_draft: false // NEVER draft
      });
      
      const { data, error } = await supabase
        .from('cars')
        .update(supabaseData)
        .eq('id', preparedData.id)
        .select('id')
        .single();
      
      if (error) {
        console.error("Error updating car:", error);
        throw error;
      }
      
      console.log("✓ Successfully updated car:", data);
      return { id: data.id };
    } else {
      const supabaseData = toSupabaseObject({
        ...preparedData,
        seller_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'available', // ALWAYS available
        is_draft: false // NEVER draft
      });
      
      const { data, error } = await supabase
        .from('cars')
        .insert(supabaseData)
        .select('id')
        .single();
      
      if (error) {
        console.error("Error creating car:", error);
        throw error;
      }
      
      console.log("✓ Successfully created car:", data);
      return { id: data.id };
    }
  } catch (error) {
    console.error("Error in submitCarListing:", error);
    throw error;
  }
};

/**
 * Create car listing using security definer function - ALWAYS available
 */
export const createCarListing = async (formData: CarListingFormData, userId: string): Promise<{ id: string }> => {
  try {
    const traceId = Math.random().toString(36).substring(2, 10);
    console.log(`[CreateCar][${traceId}] Creating IMMEDIATE available listing...`);
    
    const preparedData = prepareSubmission(formData);
    
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.error(`[CreateCar][${traceId}] Invalid userId:`, userId);
      throw new Error("Invalid user ID format");
    }
    
    console.log(`[CreateCar][${traceId}] Calling create_car_listing RPC:`, {
      dataKeys: Object.keys(preparedData),
      hasId: !!preparedData.id,
      userId: userId
    });
    
    // Call the security definer function
    const { data: rpcResponse, error } = await supabase.rpc('create_car_listing', {
      p_car_data: toSupabaseObject(preparedData),
      p_user_id: userId
    });
    
    if (error) {
      console.error(`[CreateCar][${traceId}] RPC error:`, error);
      throw new Error(`Failed to create car listing: ${error.message}`);
    }
    
    const typedResponse = rpcResponse as {success: boolean, car_id?: string, error?: string};
    
    if (!typedResponse || !typedResponse.success) {
      console.error(`[CreateCar][${traceId}] RPC failed:`, typedResponse);
      throw new Error("Failed to create car listing: " + (typedResponse?.error || "Unknown error"));
    }
    
    if (!typedResponse.car_id) {
      console.error(`[CreateCar][${traceId}] Missing car_id:`, typedResponse);
      throw new Error("Missing car ID in response");
    }
    
    console.log(`[CreateCar][${traceId}] ✓ Successfully created car:`, typedResponse);
    return { id: typedResponse.car_id };
    
  } catch (error) {
    console.error("Error in createCarListing:", error);
    throw error;
  }
};

export default {
  submitCarListing,
  createCarListing
};
