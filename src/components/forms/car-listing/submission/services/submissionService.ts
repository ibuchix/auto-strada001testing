
/**
 * Car Listing Submission Service
 * Created: 2025-05-20
 * Updated: 2025-05-24 - COMPLETELY REMOVED DRAFT LOGIC - All listings are immediately available
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { prepareSubmission } from "../utils/submission";
import { toSupabaseObject } from "@/utils/supabaseTypeUtils";

/**
 * Submit a car listing to the database - ALWAYS immediately available
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
        console.error("Error updating car in database:", error);
        throw error;
      }
      
      console.log("Successfully updated car:", data);
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
 * Create car listing using the security definer function
 */
export const createCarListing = async (formData: CarListingFormData, userId: string): Promise<{ id: string }> => {
  try {
    const traceId = Math.random().toString(36).substring(2, 10);
    console.log(`[CreateCar][${traceId}] Creating immediate listing...`);
    
    const preparedData = prepareSubmission(formData);
    
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.error(`[CreateCar][${traceId}] Invalid userId format:`, userId);
      throw new Error("Invalid user ID format");
    }
    
    console.log(`[CreateCar][${traceId}] Calling create_car_listing RPC:`, {
      dataKeys: Object.keys(preparedData),
      hasId: !!preparedData.id,
      userId: userId
    });
    
    // Call the security definer function via RPC
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
      console.error(`[CreateCar][${traceId}] RPC returned unsuccessful result:`, typedResponse);
      throw new Error("Failed to create car listing: " + (typedResponse?.error || "Unknown error"));
    }
    
    if (!typedResponse.car_id) {
      console.error(`[CreateCar][${traceId}] Missing car_id in RPC response:`, typedResponse);
      throw new Error("Missing car ID in response");
    }
    
    console.log(`[CreateCar][${traceId}] Successfully created car:`, typedResponse);
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
