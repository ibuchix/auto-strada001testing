
/**
 * Valuation service for handling vehicle valuations
 * Updated: 2025-04-28 - Added proper URL encoding for VIN parameters
 */

import { supabase } from "@/integrations/supabase/client";

export async function getValuation(
  vin: string,
  mileage: number,
  gearbox: string = 'manual',
  options: { debug?: boolean; requestId?: string } = {}
) {
  try {
    // Clean and encode the VIN
    const cleanVin = vin.trim().replace(/\s+/g, '');
    const encodedVin = encodeURIComponent(cleanVin);
    
    console.log(`[Valuation][${options.requestId || 'N/A'}] Requesting valuation for:`, {
      vin: encodedVin,
      mileage,
      gearbox,
      timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: {
        vin: encodedVin,
        mileage,
        gearbox,
        debug: options.debug
      }
    });

    if (error) throw error;

    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    console.error('Valuation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get valuation'
    };
  }
}

export function cleanupValuationData() {
  localStorage.removeItem('valuationData');
  localStorage.removeItem('tempVIN');
  localStorage.removeItem('tempMileage');
  localStorage.removeItem('tempGearbox');
  localStorage.removeItem('valuationTimestamp');
}
