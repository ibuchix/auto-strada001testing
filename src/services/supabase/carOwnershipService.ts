
/**
 * Car Ownership Service
 * Updated: 2025-05-23 - Fixed TypeScript compatibility with Supabase Json types
 */

import { supabase } from '@/integrations/supabase/client';
import { safeJsonCast } from '@/utils/supabaseTypeUtils';

/**
 * Response interface for car ownership operations
 */
interface CarOwnershipResponse {
  success: boolean;
  message?: string;
  car_id?: string;
  error_code?: string;
}

/**
 * Transition a car listing to a different status
 */
export async function transitionCarStatus(
  carId: string, 
  newStatus: string, 
  isDraft: boolean = false
): Promise<CarOwnershipResponse> {
  try {
    // Call the RPC function
    const { data, error } = await supabase.rpc('transition_car_status', {
      p_car_id: carId,
      p_new_status: newStatus,
      p_is_draft: isDraft
    });
    
    if (error) {
      console.error('RPC error transitioning car status:', error);
      return {
        success: false,
        message: error.message
      };
    }
    
    // Convert the response with type safety
    const typedResponse = safeJsonCast<CarOwnershipResponse>(data);
    
    if (typedResponse.success) {
      console.log(`Car status transitioned successfully to ${newStatus}`);
      return typedResponse;
    } else {
      console.error('Failed to transition car status:', typedResponse.message);
      return typedResponse;
    }
  } catch (error: any) {
    console.error('Exception transitioning car status:', error);
    return {
      success: false,
      message: error.message || 'Unknown error'
    };
  }
}

/**
 * Publish a car listing
 */
export async function publishCarListing(carId: string): Promise<CarOwnershipResponse> {
  try {
    // Call the RPC function
    const { data, error } = await supabase.rpc('publish_car_listing', {
      p_car_id: carId
    });
    
    if (error) {
      console.error('RPC error publishing car listing:', error);
      return {
        success: false,
        message: error.message
      };
    }
    
    // Convert the response with type safety
    const typedResponse = safeJsonCast<CarOwnershipResponse>(data);
    
    if (typedResponse.success) {
      console.log('Car listing published successfully');
      return typedResponse;
    } else {
      console.error('Failed to publish car listing:', typedResponse.message);
      return typedResponse;
    }
  } catch (error: any) {
    console.error('Exception publishing car listing:', error);
    return {
      success: false,
      message: error.message || 'Unknown error'
    };
  }
}

/**
 * Withdraw a car listing
 */
export async function withdrawCarListing(carId: string): Promise<CarOwnershipResponse> {
  try {
    // Call the RPC function
    const { data, error } = await supabase.rpc('withdraw_car_listing', {
      p_car_id: carId
    });
    
    if (error) {
      console.error('RPC error withdrawing car listing:', error);
      return {
        success: false,
        message: error.message
      };
    }
    
    // Convert the response with type safety
    const typedResponse = safeJsonCast<CarOwnershipResponse>(data);
    
    if (typedResponse.success) {
      console.log('Car listing withdrawn successfully');
      return typedResponse;
    } else {
      console.error('Failed to withdraw car listing:', typedResponse.message);
      return typedResponse;
    }
  } catch (error: any) {
    console.error('Exception withdrawing car listing:', error);
    return {
      success: false,
      message: error.message || 'Unknown error'
    };
  }
}

/**
 * Activate a car listing (set it to available)
 */
export async function activateListing(
  carId: string, 
  reservePrice?: number
): Promise<CarOwnershipResponse> {
  try {
    // Call the RPC function
    const { data, error } = await supabase.rpc('activate_listing', {
      p_listing_id: carId,
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_reserve_price: reservePrice || null
    });
    
    if (error) {
      console.error('RPC error activating listing:', error);
      return {
        success: false,
        message: error.message
      };
    }
    
    // Convert the response with type safety
    const typedResponse = safeJsonCast<CarOwnershipResponse>(data);
    
    return typedResponse;
  } catch (error: any) {
    console.error('Exception activating listing:', error);
    return {
      success: false,
      message: error.message || 'Unknown error'
    };
  }
}
