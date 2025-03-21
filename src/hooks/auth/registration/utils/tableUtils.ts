
/**
 * Utilities for direct table operations during registration
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { AuthRegisterResult } from "../../types";

/**
 * Tries direct table operations for registration
 */
export const tryDirectTableOperations = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<AuthRegisterResult> => {
  try {
    console.log("Attempting manual table updates");
    
    // Update profile table
    await updateProfileTable(supabaseClient, userId);
    
    // Update seller table
    await updateSellerTable(supabaseClient, userId);
    
    return { success: true };
  } catch (error) {
    console.error("Error in direct table operations:", error);
    return { success: false, error: "Direct table operations failed" };
  }
};

/**
 * Updates the profile table with seller role
 */
export const updateProfileTable = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<void> => {
  try {
    // First check if profile exists
    const { data: profileExists, error: profileCheckError } = await supabaseClient
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileCheckError) {
      console.error("Error checking profile:", profileCheckError);
    }
    
    if (profileExists) {
      console.log("Profile exists, updating with seller role:", profileExists);
      const { error: profileUpdateError } = await supabaseClient
        .from('profiles')
        .update({ 
          role: 'seller',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (profileUpdateError) {
        console.error("Error updating profile:", profileUpdateError);
      }
    } else {
      console.log("Profile doesn't exist, creating with seller role");
      const { error: profileCreateError } = await supabaseClient
        .from('profiles')
        .insert({ 
          id: userId, 
          role: 'seller',
          updated_at: new Date().toISOString()
        });
        
      if (profileCreateError) {
        console.error("Error creating profile:", profileCreateError);
      }
    }
  } catch (profileError) {
    console.error("Exception in profile operations:", profileError);
  }
};

/**
 * Updates the seller table with a new seller record
 */
export const updateSellerTable = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<void> => {
  try {
    // Check if seller record exists
    const { data: sellerExists, error: sellerCheckError } = await supabaseClient
      .from('sellers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (sellerCheckError) {
      console.error("Error checking if seller exists:", sellerCheckError);
    }
      
    if (!sellerExists) {
      console.log("Seller record doesn't exist, creating new seller record");
      const { error: sellerCreateError } = await supabaseClient
        .from('sellers')
        .insert({
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          verification_status: 'pending'
        });
        
      if (sellerCreateError) {
        console.error("Error creating seller record:", sellerCreateError);
      }
    } else {
      console.log("Seller record already exists:", sellerExists);
    }
  } catch (sellerError) {
    console.error("Exception in seller operations:", sellerError);
  }
};
