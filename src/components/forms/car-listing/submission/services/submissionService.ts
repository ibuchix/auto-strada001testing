
/**
 * Car Listing Submission Service
 * Created: 2025-05-20
 * Updated: 2025-05-30 - Added error handling for last_saved field and improved error logging
 * Updated: 2025-06-04 - Enhanced error handling with retry mechanism and direct database fallback
 * Updated: 2025-06-10 - Fixed UUID handling issues and improved error logging for debugging
 * Updated: 2025-06-15 - Updated to work with improved RLS policies for image association
 * Updated: 2025-06-21 - Removed RPC dependency and simplified submission with direct inserts
 * Updated: 2025-05-21 - Updated to work with enhanced RLS policy framework
 * Updated: 2025-05-22 - Refactored to use create_car_listing RPC function to bypass RLS restrictions
 * Updated: 2025-05-31 - Fixed UUID handling in prepareSubmission function for new car listings
 * Updated: 2025-06-01 - Fixed is_draft handling to prevent not-null constraint violation
 * Updated: 2025-05-22 - Fixed TypeScript compatibility with Supabase Json types
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { prepareSubmission } from "../utils/submission";
import { toSupabaseObject, safeJsonCast } from "@/utils/supabaseTypeUtils";

/**
 * Submit a car listing to the database using direct insert with RLS
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
      // Convert prepared data to Supabase-compatible format
      const supabaseData = toSupabaseObject({
        ...preparedData,
        updated_at: new Date().toISOString(),
        seller_id: userId || preparedData.seller_id,
        // Ensure is_draft is explicitly defined for update
        is_draft: preparedData.is_draft === undefined ? true : preparedData.is_draft
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
      // Convert prepared data to Supabase-compatible format
      const supabaseData = toSupabaseObject({
        ...preparedData,
        seller_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_draft: true, // Always start as draft by default for new listings
        status: 'available'
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
 * This approach bypasses RLS policies and ensures proper permission handling
 */
export const createCarListing = async (formData: CarListingFormData, userId: string): Promise<{ id: string }> => {
  try {
    // Generate a trace ID for tracking this operation through logs
    const traceId = Math.random().toString(36).substring(2, 10);
    console.log(`[CreateCar][${traceId}] Creating car using security definer function...`);
    
    // Prepare data ensuring proper type handling and UUID management
    const preparedData = prepareSubmission(formData);
    
    // Ensure userId is a valid UUID
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.error(`[CreateCar][${traceId}] Invalid userId format:`, userId);
      throw new Error("Invalid user ID format");
    }
    
    // Log the exact data being used for RPC call
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
    
    // Type-safely cast the RPC response
    const typedResponse = safeJsonCast<{success: boolean, car_id?: string, error?: string}>(rpcResponse);
    
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
