
import { logOperation } from './utils.ts';
import md5 from 'https://esm.sh/js-md5@0.8.3';

interface ValuationResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  errorCode?: string;
}

/**
 * Fetch vehicle valuation from external API
 */
export async function fetchVehicleValuation(
  vin: string,
  mileage: number,
  gearbox: string,
  requestId: string
): Promise<ValuationResult> {
  try {
    // Log API call
    logOperation('external_api_request', { 
      requestId, 
      vin, 
      mileage,
      service: 'autoiso'
    });
    
    // Get API credentials
    const apiId = 'AUTOSTRA'; // Use the provided API ID
    const apiSecretKey = Deno.env.get('CAR_API_SECRET') || '';
    
    if (!apiSecretKey) {
      throw new Error('API secret key not found in environment variables');
    }
    
    // Calculate checksum according to the API requirements
    const checksum = md5(apiId + apiSecretKey + vin);
    
    // Construct the API URL with proper parameters
    const url = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Autostrada-Edge-Function/1.0'
      }
    });
    
    // Log API response status
    logOperation('external_api_response', { 
      requestId, 
      vin, 
      status: response.status,
      statusText: response.statusText
    });
    
    // Check for success
    if (!response.ok) {
      return {
        success: false,
        error: `API error: ${response.status} ${response.statusText}`,
        errorCode: 'API_ERROR'
      };
    }
    
    // Parse the response as JSON
    const data = await response.json();
    
    // Check for API-level errors
    if (data.error || !data.success) {
      return {
        success: false,
        error: data.error || 'API returned error',
        errorCode: 'API_DATA_ERROR'
      };
    }
    
    // Calculate base price
    const basePrice = calculateBasePrice(data);
    const reservePrice = calculateReservePrice(basePrice);
    
    // Enhance the data with our calculations and ensure consistent property names
    const enhancedData = {
      ...data,
      basePrice,
      reservePrice,
      valuation: reservePrice, // Add both property names for consistency
      averagePrice: basePrice, // Add averagePrice for consistency
      transmission: gearbox, // Store the transmission type from user input
      vin // Include VIN in the data for reference
    };
    
    return {
      success: true,
      data: enhancedData
    };
  } catch (error) {
    logOperation('valuation_api_error', { 
      requestId, 
      vin, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: `Valuation service error: ${error.message}`,
      errorCode: 'VALUATION_SERVICE_ERROR'
    };
  }
}

/**
 * Calculate base price from API data
 */
function calculateBasePrice(data: any): number {
  // Extract price values, defaulting to 0 if not present
  const priceMin = Number(data.price_min) || 0;
  const priceMed = Number(data.price_med) || 0;
  
  // Calculate base price as the average of min and median
  return (priceMin + priceMed) / 2;
}

/**
 * Calculate reserve price based on specified formula
 * Base price minus (base price times percentage)
 */
function calculateReservePrice(basePrice: number): number {
  // Determine the percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) {
    percentage = 0.65;
  } else if (basePrice <= 20000) {
    percentage = 0.46;
  } else if (basePrice <= 30000) {
    percentage = 0.37;
  } else if (basePrice <= 50000) {
    percentage = 0.27;
  } else if (basePrice <= 60000) {
    percentage = 0.27;
  } else if (basePrice <= 70000) {
    percentage = 0.22;
  } else if (basePrice <= 80000) {
    percentage = 0.23;
  } else if (basePrice <= 100000) {
    percentage = 0.24;
  } else if (basePrice <= 130000) {
    percentage = 0.20;
  } else if (basePrice <= 160000) {
    percentage = 0.185;
  } else if (basePrice <= 200000) {
    percentage = 0.22;
  } else if (basePrice <= 250000) {
    percentage = 0.17;
  } else if (basePrice <= 300000) {
    percentage = 0.18;
  } else if (basePrice <= 400000) {
    percentage = 0.18;
  } else if (basePrice <= 500000) {
    percentage = 0.16;
  } else {
    percentage = 0.145; // 500,001+
  }
  
  // Calculate and round to the nearest whole number
  return Math.round(basePrice - (basePrice * percentage));
}
