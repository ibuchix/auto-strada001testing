
/**
 * Valuation service for handling external API calls and data processing
 * Created: 2025-04-28 - Extracted valuation logic
 */

import { logOperation, logApiRequest, logApiResponse } from '../utils/logging.ts';
import { ValuationError } from '../utils/error-handling.ts';
import { calculateReservePrice } from '../utils/price-calculator.ts';

interface ValuationParams {
  vin: string;
  mileage: number;
  requestId: string;
}

export async function getValuation({ vin, mileage, requestId }: ValuationParams) {
  const API_ID = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
  const API_SECRET = Deno.env.get('CAR_API_SECRET');

  if (!API_SECRET) {
    throw new ValuationError('Missing API credentials', 'CONFIG_ERROR');
  }

  // Calculate checksum for valuation API
  const checksumContent = API_ID + API_SECRET + vin;
  const encoder = new TextEncoder();
  const data = encoder.encode(checksumContent);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const startTime = performance.now();
  const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;

  logApiRequest('auto_iso_valuation', { vin, mileage }, requestId);

  const response = await fetch(apiUrl);
  const duration = performance.now() - startTime;

  if (!response.ok) {
    logOperation('valuation_api_error', {
      requestId,
      status: response.status,
      statusText: response.statusText
    }, 'error');

    throw new ValuationError(
      `Valuation API error: ${response.statusText}`,
      'API_ERROR'
    );
  }

  const valuationData = await response.json();
  logApiResponse('auto_iso_valuation', response.status, valuationData, requestId, duration);

  if (!valuationData || typeof valuationData !== 'object') {
    throw new ValuationError('Invalid response from valuation API', 'INVALID_RESPONSE');
  }

  // Process and validate the response
  const processedData = processValuationData(valuationData, requestId);
  
  // Calculate reserve price
  const reservePrice = calculateReservePrice(processedData.basePrice);
  
  return {
    ...processedData,
    reservePrice,
    vin,
    mileage
  };
}

function processValuationData(data: any, requestId: string) {
  logOperation('processing_valuation_data', {
    requestId,
    hasData: !!data,
    dataKeys: Object.keys(data)
  });

  const make = data.make || data.manufacturer;
  const model = data.model || data.modelName;
  const year = data.year || data.productionYear;

  if (!make || !model) {
    throw new ValuationError(
      'Incomplete vehicle data received',
      'INCOMPLETE_DATA',
      [{
        field: 'vehicle',
        message: 'Make and model are required'
      }]
    );
  }

  const priceMin = Number(data.price_min) || Number(data.price) || 0;
  const priceMed = Number(data.price_med) || Number(data.price) || 0;

  if (priceMin <= 0 || priceMed <= 0) {
    throw new ValuationError(
      'Invalid pricing data received',
      'INVALID_PRICING',
      [{
        field: 'pricing',
        message: 'Valid pricing information is required'
      }]
    );
  }

  const basePrice = (priceMin + priceMed) / 2;

  return {
    make,
    model,
    year,
    transmission: data.transmission || 'manual',
    basePrice,
    priceMin,
    priceMed
  };
}
