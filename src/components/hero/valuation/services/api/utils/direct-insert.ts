
/**
 * Changes made:
 * - 2025-04-27: Created direct database interaction module extracted from cache-api.ts
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationData } from "../../../types";
import { logDetailedError } from "./debug-utils";

/**
 * Helper function to attempt direct insert into cache table
 * Only used as a fallback when the security definer function fails
 */
export async function attemptDirectInsert(
  vin: string,
  mileage: number,
  valuationData: ValuationData
): Promise<boolean> {
  try {
    console.log('Starting direct insert fallback for VIN:', vin);
    
    // Try to find existing entry first
    const { data: existingData, error: selectError } = await supabase
      .from('vin_valuation_cache')
      .select('id')
      .eq('vin', vin)
      .maybeSingle();
      
    if (selectError) {
      logDetailedError(selectError, 'checking existing cache entry');
      return false;
    }
    
    if (existingData) {
      console.log('Found existing cache entry, will update. ID:', existingData.id);
      
      // Update existing record
      const { error } = await supabase
        .from('vin_valuation_cache')
        .update({
          mileage,
          valuation_data: valuationData,
          created_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
        
      if (error) {
        logDetailedError(error, 'updating valuation cache');
        return false;
      } else {
        console.log('Successfully updated existing cache entry via direct update');
        return true;
      }
    } else {
      console.log('No existing cache entry found, will insert new one');
      
      // Insert new record
      const { error } = await supabase
        .from('vin_valuation_cache')
        .insert([
          {
            vin,
            mileage,
            valuation_data: valuationData
          }
        ]);
        
      if (error) {
        logDetailedError(error, 'inserting valuation cache');
        return false;
      } else {
        console.log('Successfully inserted new cache entry via direct insert');
        return true;
      }
    }
  } catch (error) {
    console.error('Failed to store valuation in cache via direct insert:', error);
    console.error('Stack trace:', new Error().stack);
    return false;
  }
}
