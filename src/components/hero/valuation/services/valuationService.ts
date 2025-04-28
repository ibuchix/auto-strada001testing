
/**
 * Valuation service for handling vehicle valuations
 * Updated: 2025-04-28 - Added proper URL encoding for VIN parameters
 * Updated: 2025-04-29 - Fixed request format to match edge function expectations
 * Updated: 2025-04-30 - Enhanced error handling and debugging
 * Updated: 2025-05-01 - Fixed parameter handling to prevent null VIN issues
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
    
    console.log(`[Valuation][${options.requestId || 'N/A'}] Requesting valuation for:`, {
      vin: cleanVin,
      mileage,
      gearbox,
      debug: options.debug,
      timestamp: new Date().toISOString()
    });
    
    // Validate inputs before sending
    if (!cleanVin || cleanVin.length < 5) {
      console.error('[Valuation] Invalid VIN:', cleanVin);
      throw new Error('Invalid VIN format. Must be at least 5 characters.');
    }

    if (typeof mileage !== 'number' || isNaN(mileage) || mileage < 0) {
      console.error('[Valuation] Invalid mileage:', mileage);
      mileage = 0; // Default to 0 if invalid
    }

    // Use body parameter for the request instead of URL params
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: {
        vin: cleanVin,
        mileage: Number(mileage), // Ensure it's a number
        gearbox: gearbox || 'manual', // Ensure default if undefined
        debug: options.debug || false
      }
    });

    if (error) {
      console.error('[Valuation] Edge function error:', error);
      
      // Log more detailed error information when available
      if (error.message) {
        console.error('[Valuation] Error message:', error.message);
      }
      
      if (error.context) {
        console.error('[Valuation] Error context:', error.context);
      }
      
      throw error;
    }

    // Add validation for the response
    if (!data) {
      console.error('[Valuation] No data returned from edge function');
      throw new Error('No data returned from valuation service');
    }

    console.log('[Valuation] Received successful response:', {
      dataReceived: !!data,
      dataSize: data ? JSON.stringify(data).length : 0,
      hasValidMake: data?.make ? true : false,
      hasValidModel: data?.model ? true : false
    });

    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    console.error('[Valuation] Service error:', error);
    
    // Enhance logging with more detailed error information
    if (error.message) {
      console.error('[Valuation] Error message:', error.message);
    }
    
    if (error.status) {
      console.error('[Valuation] Error status:', error.status);
    }
    
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
