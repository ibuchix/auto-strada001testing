
/**
 * Car Listing Submission Service
 * Created: 2025-05-20
 * Updated: 2025-05-30 - Added error handling for last_saved field and improved error logging
 * Updated: 2025-06-04 - Enhanced error handling with retry mechanism and direct database fallback
 * Updated: 2025-06-10 - Fixed UUID handling issues and improved error logging for debugging
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
    // Generate a trace ID for tracking this operation through logs
    const traceId = Math.random().toString(36).substring(2, 10);
    console.log(`[CreateCar][${traceId}] Creating car using RPC function...`);
    
    // Prepare data ensuring proper type handling
    const preparedData = prepareSubmission(formData);
    
    // Ensure userId is a valid UUID
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.error(`[CreateCar][${traceId}] Invalid userId format:`, userId);
      throw new Error("Invalid user ID format");
    }
    
    // Log the exact data being sent to detect any issues
    console.log(`[CreateCar][${traceId}] Sending data to create_car_listing:`, {
      dataKeys: Object.keys(preparedData),
      userId: userId
    });
    
    // Call the create_car_listing function with explicit parameter naming
    const { data, error } = await supabase
      .rpc('create_car_listing', {
        p_car_data: preparedData,
        p_user_id: userId
      });
    
    if (error) {
      console.error(`[CreateCar][${traceId}] RPC error:`, error);
      
      // Handle known error types with informative messages
      if (error.code === 'PGRST202') {
        console.error(`[CreateCar][${traceId}] Function not found in schema cache. Check if the function exists and parameters match.`);
      } else if (error.code === '22P02') {
        console.error(`[CreateCar][${traceId}] Invalid UUID format. Check parameter types.`);
      } else if (error.code === '42501') {
        console.error(`[CreateCar][${traceId}] Permission denied. Verify RLS policies.`);
      }
      
      throw error;
    }
    
    if (!data || !data.car_id) {
      console.error(`[CreateCar][${traceId}] Missing car_id in response:`, data);
      throw new Error("Missing car ID in response");
    }
    
    console.log(`[CreateCar][${traceId}] Successfully created car using RPC:`, data);
    return { id: data.car_id };
    
  } catch (error) {
    console.error("Error in createCarUsingRPC:", error);
    
    // Fall back to standard method if RPC fails
    console.log("Falling back to standard submission method");
    return submitCarListing(formData, userId);
  }
};

export default {
  submitCarListing,
  createCarUsingRPC
};
