import md5 from "js-md5";
import { ValuationRequest, ValuationResponse } from "../types.ts";
import { extractVehicleDetails } from "../utils/vehicleDataExtractor.ts";

const API_BASE_URL = 'https://bp.autoiso.pl/api/v3';
const API_ID = 'AUTOSTRA';

async function calculateChecksum(vin: string): Promise<string> {
  console.log('Starting checksum calculation for VIN:', vin);
  
  const apiSecret = Deno.env.get('CAR_API_SECRET');
  if (!apiSecret) {
    throw new Error('API secret is not configured');
  }

  const input = `${API_ID}${apiSecret}${vin}`;
  console.log('Raw input string length:', input.length);

  // Calculate MD5 hash using js-md5
  const checksum = md5(input);
  console.log('Calculated checksum:', checksum);

  // Validate with test case
  const testVin = 'WAUZZZ8K79A090954';
  const testInput = `${API_ID}${apiSecret}${testVin}`;
  const testChecksum = md5(testInput);
  const expectedTestChecksum = '6c6f042d5c5c4ce3c3b3a7e752547ae0';
  
  console.log('Test case validation:', {
    testVin,
    calculatedChecksum: testChecksum,
    expectedChecksum: expectedTestChecksum,
    matches: testChecksum === expectedTestChecksum
  });

  if (testChecksum !== expectedTestChecksum) {
    console.error('Test case validation failed - checksum calculation might be incorrect');
    throw new Error('Checksum validation failed - please check API configuration');
  }

  return checksum;
}

async function fetchVehicleDetails(checksum: string, vin: string) {
  const url = `${API_BASE_URL}/getVinDetails/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}`;
  console.log('Fetching vehicle details from:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AutoStra-API-Client/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vehicle details API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      });
      throw new Error(`Vehicle details API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Vehicle details API response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Failed to fetch vehicle details:', error);
    throw error;
  }
}

async function fetchValuation(checksum: string, vin: string, mileage: number, gearbox: string) {
  const url = `${API_BASE_URL}/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox}/currency:PLN`;
  console.log('Fetching valuation from:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AutoStra-API-Client/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Valuation API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      });
      throw new Error(`Valuation API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Valuation API response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Failed to fetch valuation:', error);
    throw error;
  }
}

export async function getVehicleValuation(data: ValuationRequest): Promise<ValuationResponse> {
  console.log('Processing valuation request:', data);

  if (!data.vin || typeof data.vin !== 'string' || data.vin.length < 11) {
    console.error('Invalid VIN format:', data.vin);
    throw new Error('Invalid VIN format');
  }

  if (!data.mileage || isNaN(data.mileage) || data.mileage < 0) {
    console.error('Invalid mileage value:', data.mileage);
    throw new Error('Invalid mileage value');
  }

  try {
    const checksum = await calculateChecksum(data.vin);
    console.log('Calculated checksum:', checksum);

    const [detailsData, valuationData] = await Promise.all([
      fetchVehicleDetails(checksum, data.vin),
      fetchValuation(checksum, data.vin, data.mileage, data.gearbox || 'manual')
    ]);

    console.log('API Responses:', {
      details: detailsData,
      valuation: valuationData
    });

    const vehicleInfo = extractVehicleDetails(detailsData, valuationData);
    console.log('Extracted vehicle info:', vehicleInfo);

    return {
      ...vehicleInfo,
      vin: data.vin,
      transmission: data.gearbox || 'manual',
      mileage: data.mileage
    };
  } catch (error) {
    console.error('Valuation error:', error);
    throw error;
  }
}