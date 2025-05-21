
/**
 * Car Ownership Service
 * Created: 2025-05-21
 * 
 * This service provides functions to manage car ownership and status transitions
 * with proper ownership validation and history tracking.
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Publishes a car listing, transitioning it from draft to active status
 * Ensures the user has proper ownership before making the change
 */
export const publishCarListing = async (carId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.rpc('publish_car_listing', {
      p_car_id: carId
    });
    
    if (error) {
      console.error("Error publishing car listing:", error);
      throw error;
    }
    
    return {
      success: data.success as boolean,
      message: data.message as string
    };
  } catch (error: any) {
    toast.error("Failed to publish listing", {
      description: error.message || "Unexpected error occurred"
    });
    
    return {
      success: false,
      message: error.message || "Failed to publish listing"
    };
  }
};

/**
 * Withdraws a car listing while ensuring proper ownership
 */
export const withdrawCarListing = async (carId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.rpc('withdraw_car_listing', {
      p_car_id: carId
    });
    
    if (error) {
      console.error("Error withdrawing car listing:", error);
      throw error;
    }
    
    return {
      success: data.success as boolean,
      message: data.message as string
    };
  } catch (error: any) {
    toast.error("Failed to withdraw listing", {
      description: error.message || "Unexpected error occurred"
    });
    
    return {
      success: false,
      message: error.message || "Failed to withdraw listing"
    };
  }
};

/**
 * Transition a car listing to a different status
 */
export const transitionCarStatus = async (
  carId: string, 
  newStatus: string, 
  isDraft?: boolean
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.rpc('transition_car_status', {
      p_car_id: carId,
      p_new_status: newStatus,
      p_is_draft: isDraft
    });
    
    if (error) {
      console.error("Error transitioning car status:", error);
      throw error;
    }
    
    return {
      success: data.success as boolean,
      message: data.message as string
    };
  } catch (error: any) {
    toast.error("Failed to change listing status", {
      description: error.message || "Unexpected error occurred"
    });
    
    return {
      success: false,
      message: error.message || "Failed to change listing status"
    };
  }
};

interface OwnershipHistoryEntry {
  change_time: string;
  change_type: string;
  previous_status: string | null;
  new_status: string | null;
  is_draft: boolean;
  changed_by: string | null;
}

/**
 * Get the ownership and status history for a car listing
 */
export const getCarOwnershipHistory = async (carId: string): Promise<OwnershipHistoryEntry[]> => {
  try {
    const { data, error } = await supabase.rpc('get_car_ownership_history', {
      p_car_id: carId
    });
    
    if (error) {
      console.error("Error getting car ownership history:", error);
      throw error;
    }
    
    return data as OwnershipHistoryEntry[] || [];
  } catch (error: any) {
    console.error("Failed to fetch listing history:", error);
    return [];
  }
};
