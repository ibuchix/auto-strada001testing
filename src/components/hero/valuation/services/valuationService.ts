
/**
 * Valuation Service
 * Updated: 2025-05-11 - Improved CORS handling and error recovery
 */
import { supabase } from "@/integrations/supabase/client";
import { getDirectValuation } from "@/services/valuation/directValuationService";

export async function getValuation(
  vin: string,
  mileage: number | string,
  gearbox: string = "manual",
  options: { requestId?: string } = {}
) {
  console.log('[Valuation][' + (options.requestId || 'N/A') + '] Requesting valuation for:', {
    vin,
    mileage,
    gearbox,
    debug: options.requestId,
    timestamp: new Date().toISOString()
  });

  // Normalize mileage to number
  const normalizedMileage = typeof mileage === 'string' ? parseInt(mileage, 10) : mileage;

  // First try the direct API approach which uses our proxy to avoid CORS issues
  try {
    console.log('[Valuation] Attempting direct API call');
    const directResult = await getDirectValuation(vin, normalizedMileage, gearbox);
    
    if (directResult.success) {
      console.log('[Valuation] Direct API call successful');
      return directResult;
    }
    
    console.log('[Valuation] Direct API call failed, trying edge function');
  } catch (error) {
    console.error('[Valuation] Direct API call error:', error);
    console.log('[Valuation] Direct API call failed, trying edge function');
  }

  // Fallback to edge function if direct API call fails
  try {
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { vin, mileage: normalizedMileage, gearbox }
    });

    if (error) {
      console.error('[Valuation] Edge function error:', error);
      console.error('[Valuation] Error message:', error.message);
      console.error('[Valuation] Error context:', error.context);
      throw error;
    }

    return {
      success: true,
      data: data.data,
      method: 'edge-function'
    };
  } catch (error) {
    console.error('[Valuation] Edge function error:', error);
    console.error('[Valuation] Error message:', error.message);
    console.error('[Valuation] Error context:', error?.context || {});
    console.error('[Valuation] All valuation methods failed');
    console.error('[Valuation] Service error:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to get valuation'
    };
  }
}

/**
 * Clean up any saved valuation data
 */
export function cleanupValuationData() {
  try {
    localStorage.removeItem('valuationData');
    localStorage.removeItem('valuationTimestamp');
  } catch (e) {
    console.error('Error clearing valuation data:', e);
  }
}
