
/**
 * Client service for interacting with the valuation API
 */
import { supabase } from "@/integrations/supabase/client";
import { ApiError } from "../errors/apiError";
import { toast } from "sonner";

/**
 * Get valuation for a vehicle by VIN
 */
export async function getVehicleValuation(
  vin: string, 
  mileage: number, 
  gearbox: string
) {
  try {
    console.log('Getting valuation for:', { vin, mileage, gearbox });
    
    // Use the dedicated valuation endpoint
    const { data, error } = await supabase.functions.invoke(
      'get-vehicle-valuation',
      {
        body: { 
          vin, 
          mileage, 
          gearbox 
        }
      }
    );
    
    if (error) {
      console.error('Valuation API error:', error);
      throw new ApiError('Failed to get vehicle valuation', error);
    }
    
    return { 
      data,
      error: null
    };
  } catch (error) {
    console.error('Valuation service error:', error);
    toast.error('Failed to get vehicle valuation');
    
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in valuation service')
    };
  }
}

/**
 * Get seller valuation for a vehicle by VIN (with auth)
 * This still uses the handle-seller-operations endpoint as it needs
 * additional seller-specific validation
 */
export async function getSellerValuation(
  vin: string, 
  mileage: number, 
  gearbox: string,
  userId: string
) {
  try {
    console.log('Getting seller valuation for:', { vin, mileage, gearbox, userId });
    
    const { data, error } = await supabase.functions.invoke(
      'handle-seller-operations',
      {
        body: {
          operation: 'validate_vin',
          vin,
          mileage,
          gearbox,
          userId
        }
      }
    );
    
    if (error) {
      console.error('Seller valuation API error:', error);
      throw new ApiError('Failed to get seller valuation', error);
    }
    
    if (!data.success) {
      return {
        data: null,
        error: new Error(data.error || 'Failed to validate VIN')
      };
    }
    
    return { 
      data: data.data,
      error: null
    };
  } catch (error) {
    console.error('Seller valuation service error:', error);
    toast.error('Failed to get seller valuation');
    
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in seller valuation service')
    };
  }
}
