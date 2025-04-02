
/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType } from "../../types";

/**
 * Fetch valuation data from API for seller context
 */
export async function fetchSellerValuationData(
  vin: string, 
  mileage: number, 
  gearbox: TransmissionType, 
  userId: string
): Promise<{ data?: any; error?: Error }> {
  try {
    console.log('Fetching seller valuation from API for:', { vin, mileage, gearbox, userId });
    
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
      console.error('Edge function error:', error);
      throw new Error(`API error: ${error.message}`);
    }
    
    if (!data.success) {
      return {
        error: new Error(data.error || 'Failed to validate VIN')
      };
    }
    
    return { data };
  } catch (error: any) {
    console.error('Error fetching seller valuation:', error);
    return { 
      error: error instanceof Error ? error : new Error(error.message || 'Unknown error') 
    };
  }
}
