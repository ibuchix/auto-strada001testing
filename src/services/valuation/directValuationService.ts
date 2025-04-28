
/**
 * Direct valuation service
 * Created: 2025-05-08 - Added reliable direct API client for vehicle valuation
 * Updated: 2025-05-10 - Fixed crypto-js dependency issue
 * Updated: 2025-05-11 - Implemented CORS proxy solution for direct API access
 */

import { calculateReservePrice } from '@/utils/valuation/valuationCalculator';
import md5 from 'crypto-js/md5';
import { toast } from 'sonner';

// Define valuation method for tracking purposes
export type ValuationMethod = 'direct-api' | 'edge-function' | 'fallback';

/**
 * Make a direct API call to the valuation service through a CORS proxy
 * This bypasses CORS restrictions and handles API interaction directly
 */
export async function getDirectValuation(
  vin: string,
  mileage: number,
  gearbox: string = 'manual'
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  method: ValuationMethod;
  rawData?: any;
}> {
  console.log('[DirectValuation] Starting direct API valuation for:', { vin, mileage, gearbox });
  
  try {
    // API credentials (normally these would be in an edge function)
    const API_ID = 'AUTOSTRA';
    const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    
    // Calculate checksum for API authentication
    const checksumContent = API_ID + API_SECRET + vin;
    const checksum = md5(checksumContent).toString();
    
    // Instead of directly calling the API, we'll use our edge function as a CORS proxy
    // This is a reliable approach that doesn't require external services
    const proxyUrl = `/api/get-vehicle-valuation`;
    
    console.log('[DirectValuation] Calling valuation via Edge Function proxy');
    
    // Make API request through our proxy
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        vin,
        mileage,
        gearbox,
        debug: false
      })
    });
    
    // Check for successful response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DirectValuation] API error:', {
        status: response.status,
        error: errorText
      });
      
      return {
        success: false,
        error: `API error: ${response.status} - ${errorText}`,
        method: 'direct-api'
      };
    }
    
    // Parse API response
    const responseData = await response.json();
    
    if (!responseData.success) {
      return {
        success: false,
        error: responseData.error || 'Unknown error',
        method: 'direct-api'
      };
    }
    
    const rawData = responseData.data;
    console.log('[DirectValuation] Raw API response received:', {
      dataSize: JSON.stringify(rawData).length,
      keys: Object.keys(rawData)
    });
    
    // Extract and normalize data
    const functionResponse = rawData.functionResponse || {};
    const userParams = functionResponse.userParams || {};
    const calcValuation = functionResponse.valuation?.calcValuation || {};
    
    // Extract essential fields with fallbacks
    const make = userParams.make || rawData.make || '';
    const model = userParams.model || rawData.model || '';
    const year = userParams.year || rawData.productionYear || rawData.year || 0;
    
    // Extract pricing data with multiple fallback paths
    let priceMin = 0;
    let priceMed = 0;
    
    if (calcValuation.price_min !== undefined) {
      priceMin = Number(calcValuation.price_min);
    } else if (rawData.price_min !== undefined) {
      priceMin = Number(rawData.price_min);
    }
    
    if (calcValuation.price_med !== undefined) {
      priceMed = Number(calcValuation.price_med);
    } else if (rawData.price_med !== undefined) {
      priceMed = Number(rawData.price_med);
    }
    
    // Calculate base price (average of min and median)
    let basePrice = 0;
    if (priceMin > 0 && priceMed > 0) {
      basePrice = (priceMin + priceMed) / 2;
    } else {
      // Fallback to other price fields
      basePrice = calcValuation.price || rawData.price || rawData.valuation || 0;
    }
    
    // Calculate reserve price using our pricing logic
    const reservePrice = calculateReservePrice(basePrice);
    
    console.log('[DirectValuation] Processed valuation data:', {
      make,
      model,
      year,
      basePrice,
      reservePrice
    });
    
    // Return normalized data matching expected structure
    return {
      success: true,
      data: {
        vin,
        make,
        model,
        year,
        mileage,
        transmission: gearbox,
        basePrice,
        reservePrice,
        valuation: basePrice,
        averagePrice: priceMed || basePrice,
        price_min: priceMin,
        price_med: priceMed,
        functionResponse  // Include the complete function response for compatibility
      },
      method: 'direct-api',
      rawData // Include raw data for diagnostic purposes
    };
  } catch (error: any) {
    console.error('[DirectValuation] Error:', error);
    
    // Provide detailed error information
    return {
      success: false,
      error: `Direct valuation error: ${error.message || error}`,
      method: 'direct-api'
    };
  }
}

/**
 * Enhanced validation function for direct VIN validation
 */
export async function validateVinDirectly(vin: string, mileage: number = 0): Promise<any> {
  try {
    const result = await getDirectValuation(vin, mileage);
    return result.data;
  } catch (error: any) {
    console.error('[DirectValuation] Validation error:', error);
    throw new Error(error.message || 'VIN validation failed');
  }
}
