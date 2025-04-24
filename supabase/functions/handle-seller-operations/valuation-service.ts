
/**
 * Valuation service for seller operations
 * Updated: 2025-04-21 - Fixed import paths to use local utils instead of shared
 * Updated: 2025-04-24 - Removed ALL caching functionality to ensure direct API calls
 */

import { logOperation } from './utils/logging.ts';
import { OperationError } from './error-handler.ts';
import { calculateMd5 } from './utils/checksum.ts';

export async function fetchVehicleValuation(
  vin: string,
  mileage: number,
  gearbox: string | null,
  requestId: string
): Promise<{
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  errorCode?: string;
}> {
  try {
    // Log the start of valuation fetch
    logOperation('fetch_valuation_start', {
      requestId,
      vin,
      mileage,
      gearbox: gearbox || 'unknown',
      timestamp: new Date().toISOString()
    });

    // Get API credentials
    const apiId = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiSecret) {
      logOperation('missing_api_credentials', { requestId }, 'error');
      throw new OperationError('API credentials not configured correctly', 'API_CONFIG_ERROR');
    }

    // Calculate checksum for API
    const checksumContent = apiId + apiSecret + vin;
    const checksum = await calculateMd5(checksumContent);

    // Build the API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;

    // ALWAYS make direct API call - no caching
    logOperation('making_direct_api_call', {
      requestId,
      vin,
      timestamp: new Date().toISOString()
    });

    // Fetch from external API
    const apiStartTime = performance.now();
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    const apiCallDuration = performance.now() - apiStartTime;

    // Log API response metrics
    logOperation('api_response_received', {
      requestId,
      status: response.status,
      durationMs: apiCallDuration.toFixed(2),
      timestamp: new Date().toISOString()
    });

    // Check for HTTP errors
    if (!response.ok) {
      logOperation('api_http_error', {
        requestId,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      }, 'error');

      return {
        success: false,
        error: `HTTP Error: ${response.status} ${response.statusText}`,
        errorCode: 'API_HTTP_ERROR'
      };
    }

    // Parse response
    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logOperation('api_parse_error', {
        requestId,
        error: parseError.message,
        responsePreview: responseText.substring(0, 200),
        timestamp: new Date().toISOString()
      }, 'error');

      return {
        success: false,
        error: 'Failed to parse API response',
        errorCode: 'API_PARSE_ERROR'
      };
    }

    // Check for API-level errors
    if (data.error) {
      logOperation('api_returned_error', {
        requestId,
        error: data.error,
        timestamp: new Date().toISOString()
      }, 'error');

      return {
        success: false,
        error: data.error,
        errorCode: 'API_ERROR'
      };
    }

    // Process the data
    const processedData = processValuationData(data, vin, mileage, gearbox);

    logOperation('valuation_data_processed', {
      requestId,
      vin,
      make: processedData.make,
      model: processedData.model,
      year: processedData.year,
      timestamp: new Date().toISOString()
    });

    // Return the processed data
    return {
      success: true,
      data: processedData
    };
  } catch (error) {
    logOperation('valuation_fetch_error', {
      requestId,
      vin,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, 'error');

    return {
      success: false,
      error: error.message || 'Error fetching valuation',
      errorCode: error.code || 'VALUATION_ERROR'
    };
  }
}

// Process valuation data into a consistent format
function processValuationData(
  rawData: any,
  vin: string,
  mileage: number,
  gearbox: string | null
): Record<string, any> {
  // Extract core fields with fallbacks
  const make = rawData.make || rawData.manufacturer || '';
  const model = rawData.model || rawData.modelName || '';
  const year = rawData.year || rawData.productionYear || 0;
  const transmission = gearbox || rawData.transmission || 'manual';

  // Extract pricing data
  let priceMin = 0;
  let priceMed = 0;

  // Handle different property name conventions
  if (rawData.price_min !== undefined) priceMin = parseFloat(rawData.price_min);
  else if (rawData.priceMin !== undefined) priceMin = parseFloat(rawData.priceMin);
  else if (rawData.minimum_price !== undefined) priceMin = parseFloat(rawData.minimum_price);

  if (rawData.price_med !== undefined) priceMed = parseFloat(rawData.price_med);
  else if (rawData.priceMed !== undefined) priceMed = parseFloat(rawData.priceMed);
  else if (rawData.median_price !== undefined) priceMed = parseFloat(rawData.median_price);

  // Try to calculate base price
  let basePrice = 0;
  if (priceMin > 0 && priceMed > 0) {
    basePrice = (priceMin + priceMed) / 2;
  } else if (rawData.price) {
    basePrice = parseFloat(rawData.price);
  } else if (rawData.valuation) {
    basePrice = parseFloat(rawData.valuation);
  }

  // Calculate reserve price
  let reservePrice = 0;
  if (basePrice > 0) {
    reservePrice = calculateReservePrice(basePrice);
  } else {
    // If we have make/model but no price, set default values
    if (make && model && year > 0) {
      basePrice = 30000;
      reservePrice = 21900; // ~27% off default base price
    }
  }

  // Return formatted data
  return {
    vin,
    make,
    model,
    year,
    mileage,
    transmission,
    basePrice: Math.round(basePrice),
    reservePrice: Math.round(reservePrice),
    valuation: Math.round(reservePrice), // Duplicate for compatibility
    averagePrice: Math.round(basePrice),
    price_min: Math.round(priceMin),
    price_med: Math.round(priceMed),
  };
}

// Calculate reserve price based on price tiers
function calculateReservePrice(basePrice: number): number {
  let percentage = 0.25; // Default percentage

  if (basePrice <= 15000) percentage = 0.65;
  else if (basePrice <= 20000) percentage = 0.46;
  else if (basePrice <= 30000) percentage = 0.37;
  else if (basePrice <= 50000) percentage = 0.27;
  else if (basePrice <= 60000) percentage = 0.27;
  else if (basePrice <= 70000) percentage = 0.22;
  else if (basePrice <= 80000) percentage = 0.23;
  else if (basePrice <= 100000) percentage = 0.24;
  else if (basePrice <= 130000) percentage = 0.20;
  else if (basePrice <= 160000) percentage = 0.185;
  else if (basePrice <= 200000) percentage = 0.22;
  else if (basePrice <= 250000) percentage = 0.17;
  else if (basePrice <= 300000) percentage = 0.18;
  else if (basePrice <= 400000) percentage = 0.18;
  else if (basePrice <= 500000) percentage = 0.16;
  else percentage = 0.145;

  return basePrice - (basePrice * percentage);
}
