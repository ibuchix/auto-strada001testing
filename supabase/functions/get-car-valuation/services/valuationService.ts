import md5 from 'js-md5';
import { ValuationRequest, ValuationResponse, ApiResponse } from '../types.ts';
import { validateRequest } from '../utils/validation.ts';

const API_BASE_URL = 'https://bp.autoiso.pl/api/v3';
const API_ID = 'AUTOSTRA';
const TEST_VIN = 'WAUZZZ8K79A090954';
const TEST_CHECKSUM = '6c6f042d5c5c4ce3c3b3a7e752547ae0';

async function calculateChecksum(vin: string): Promise<string> {
  console.log('Starting checksum calculation for VIN:', vin);
  
  const apiSecret = Deno.env.get('CAR_API_SECRET');
  if (!apiSecret) {
    throw new Error('API secret is not configured');
  }

  const input = `${API_ID}${apiSecret}${vin}`;
  console.log('Input string prepared, length:', input.length);

  const checksum = md5(input);
  console.log('Calculated checksum:', checksum);

  // Validate with test case
  const testInput = `${API_ID}${apiSecret}${TEST_VIN}`;
  const testChecksum = md5(testInput);
  
  console.log('Test case validation:', {
    testVin: TEST_VIN,
    expectedChecksum: TEST_CHECKSUM,
    calculatedChecksum: testChecksum,
    matches: testChecksum === TEST_CHECKSUM
  });

  if (testChecksum !== TEST_CHECKSUM) {
    throw new Error('Checksum validation failed - algorithm mismatch');
  }

  return checksum;
}

async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

async function fetchVehicleDetails(checksum: string, vin: string): Promise<ApiResponse> {
  const url = `${API_BASE_URL}/getVinDetails/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}`;
  console.log('Fetching vehicle details from:', url);
  
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AutoStra-API-Client/1.0'
      },
      timeout: 15000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vehicle details API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Vehicle details API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Vehicle details API response:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch vehicle details:', error);
    throw error;
  }
}

async function fetchValuation(
  checksum: string, 
  vin: string, 
  mileage: number, 
  gearbox: string
): Promise<ApiResponse> {
  const url = `${API_BASE_URL}/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox}/currency:PLN`;
  console.log('Fetching valuation from:', url);
  
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AutoStra-API-Client/1.0'
      },
      timeout: 15000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Valuation API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Valuation API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Valuation API response:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch valuation:', error);
    throw error;
  }
}

export async function getVehicleValuation(data: ValuationRequest): Promise<ValuationResponse> {
  console.log('Starting valuation process for:', JSON.stringify(data, null, 2));

  const validation = validateRequest(data);
  if (!validation.isValid) {
    console.error('Validation failed:', validation.error);
    throw new Error(validation.error);
  }

  try {
    const checksum = await calculateChecksum(data.vin);
    console.log('Checksum calculated successfully:', checksum);

    const [detailsResponse, valuationResponse] = await Promise.all([
      fetchVehicleDetails(checksum, data.vin),
      fetchValuation(checksum, data.vin, data.mileage, data.gearbox || 'manual')
    ]);

    if (!detailsResponse.success || !valuationResponse.success) {
      throw new Error('Failed to fetch complete vehicle data');
    }

    const details = detailsResponse.data;
    const valuation = valuationResponse.data;

    console.log('Processing responses:', {
      details: details,
      valuation: valuation
    });

    // Extract and validate required fields
    const response: ValuationResponse = {
      make: details.make || 'Unknown',
      model: details.model || 'Unknown',
      year: parseInt(details.year) || new Date().getFullYear(),
      vin: data.vin,
      transmission: data.gearbox || 'manual',
      mileage: data.mileage,
      valuation: valuation.price || valuation.valuation || null,
      averagePrice: valuation.averagePrice || null,
      rawDetails: details,
      rawValuation: valuation
    };

    console.log('Final processed response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Valuation process failed:', error);
    throw error;
  }
}