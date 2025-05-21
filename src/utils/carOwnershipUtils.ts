
/**
 * Car Ownership Utilities
 * Created: 2025-05-21
 * 
 * Utility functions for handling car ownership validation and management
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Validates if the current user owns a car listing
 * 
 * @param carId The ID of the car to check
 * @returns Promise resolving to ownership status
 */
export const validateCarOwnership = async (carId: string): Promise<{ isOwner: boolean; error?: string }> => {
  try {
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { 
        isOwner: false, 
        error: "Authentication required to verify ownership" 
      };
    }
    
    // Check if the user is the owner of the car
    const { data, error } = await supabase
      .from('cars')
      .select('seller_id')
      .eq('id', carId)
      .single();
    
    if (error) {
      console.error("Error validating car ownership:", error);
      return { 
        isOwner: false, 
        error: error.message 
      };
    }
    
    // Compare seller_id with current user ID
    const isOwner = data?.seller_id === session.user.id;
    
    return { 
      isOwner,
      error: isOwner ? undefined : "You do not own this car listing" 
    };
  } catch (error: any) {
    console.error("Exception in validateCarOwnership:", error);
    return { 
      isOwner: false, 
      error: error.message || "Failed to validate car ownership" 
    };
  }
};

/**
 * Validates ownership before performing an action and executes the action if authorized
 * 
 * @param carId The ID of the car
 * @param action The action to perform if ownership is valid
 * @returns Promise resolving to the action result or ownership error
 */
export const withOwnershipValidation = async <T>(
  carId: string, 
  action: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> => {
  // Validate ownership first
  const { isOwner, error } = await validateCarOwnership(carId);
  
  if (!isOwner) {
    return { 
      success: false, 
      error: error || "Ownership validation failed" 
    };
  }
  
  // Perform the action if ownership is valid
  try {
    const result = await action();
    return { 
      success: true, 
      data: result 
    };
  } catch (actionError: any) {
    console.error("Error in withOwnershipValidation action:", actionError);
    return { 
      success: false, 
      error: actionError.message || "Action failed"
    };
  }
};
