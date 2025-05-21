
/**
 * Car Listing Submission Service
 * Created: 2025-05-20
 * Updated: 2025-05-30 - Added error handling for last_saved field and improved error logging
 * Updated: 2025-06-04 - Enhanced error handling with retry mechanism and direct database fallback
 * Updated: 2025-06-10 - Fixed UUID handling issues and improved error logging for debugging
 * Updated: 2025-06-15 - Updated to work with improved RLS policies for image association
 * Updated: 2025-06-21 - Removed RPC dependency and simplified submission with direct inserts
 * Updated: 2025-05-21 - Updated to work with enhanced RLS policy framework
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { prepareSubmission } from "../utils/submission";

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
          is_draft: true, // Start as draft by default
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
 * Create car listing using direct database insert
 * Uses the improved RLS policies for secure car creation
 */
export const createCarListing = async (formData: CarListingFormData, userId: string): Promise<{ id: string }> => {
  try {
    // Generate a trace ID for tracking this operation through logs
    const traceId = Math.random().toString(36).substring(2, 10);
    console.log(`[CreateCar][${traceId}] Creating car using direct database insert...`);
    
    // Prepare data ensuring proper type handling
    const preparedData = prepareSubmission(formData);
    
    // Ensure userId is a valid UUID
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.error(`[CreateCar][${traceId}] Invalid userId format:`, userId);
      throw new Error("Invalid user ID format");
    }
    
    // Log the exact data being used for insert
    console.log(`[CreateCar][${traceId}] Inserting car data:`, {
      dataKeys: Object.keys(preparedData),
      userId: userId
    });
    
    // Insert directly to cars table - this uses our improved RLS policies
    const { data, error } = await supabase
      .from('cars')
      .insert({
        ...preparedData,
        seller_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_draft: true,
        status: 'available'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error(`[CreateCar][${traceId}] Insert error:`, error);
      
      // Fall back to standard method if direct insert fails
      console.log(`[CreateCar][${traceId}] Falling back to standard submission method`);
      return submitCarListing(formData, userId);
    }
    
    if (!data || !data.id) {
      console.error(`[CreateCar][${traceId}] Missing id in response:`, data);
      throw new Error("Missing car ID in response");
    }
    
    console.log(`[CreateCar][${traceId}] Successfully created car:`, data);
    return { id: data.id };
    
  } catch (error) {
    console.error("Error in createCarListing:", error);
    
    // Fall back to standard method if there's any error
    console.log("Falling back to standard submission method");
    return submitCarListing(formData, userId);
  }
};

export default {
  submitCarListing,
  createCarListing
};
