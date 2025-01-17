import { calculateChecksum } from "../utils/checksum.ts";
import { ValuationRequest, ValuationResponse } from "../types.ts";
import { extractVehicleDetails } from "../utils/vehicleDataExtractor.ts";

const API_BASE_URL = 'https://bp.autoiso.pl/api/v3';

async function fetchVehicleDetails(apiId: string, checksum: string, vin: string) {
  const detailsUrl = `${API_BASE_URL}/getVinDetails/apiuid:${apiId}/checksum:${checksum}/vin:${vin}`;
  console.log('Fetching vehicle details from:', detailsUrl);
  
  const response = await fetch(detailsUrl, {
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
      errorText
    });
    throw new Error(`Vehicle details API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function fetchValuation(apiId: string, checksum: string, vin: string, mileage: number, gearbox: string) {
  const valuationUrl = `${API_BASE_URL}/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox}/currency:PLN`;
  console.log('Fetching valuation from:', valuationUrl);
  
  const response = await fetch(valuationUrl, {
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
      errorText
    });
    throw new Error(`Valuation API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

export async function getVehicleValuation(data: ValuationRequest): Promise<ValuationResponse> {
  console.log('Processing valuation request:', data);

  const apiId = 'AUTOSTRA';
  const apiSecret = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
  
  if (!data.vin || typeof data.vin !== 'string' || data.vin.length < 11) {
    throw new Error('Invalid VIN format');
  }

  if (!data.mileage || isNaN(data.mileage) || data.mileage < 0) {
    throw new Error('Invalid mileage value');
  }

  try {
    // Log the exact string being used for checksum calculation
    const checksumInput = `${apiId}${apiSecret}${data.vin}`;
    console.log('Checksum input string:', checksumInput);
    console.log('Checksum input length:', checksumInput.length);
    console.log('Checksum input bytes:', [...new TextEncoder().encode(checksumInput)]);

    const checksum = await calculateChecksum(apiId, apiSecret, data.vin);
    console.log('Calculated checksum:', checksum);

    // Test with known example from documentation
    const testVin = 'WAUZZZ8K79A090954';
    const testInput = `${apiId}${apiSecret}${testVin}`;
    const testChecksum = await calculateChecksum(apiId, apiSecret, testVin);
    console.log('Test example results:', {
      input: testInput,
      checksum: testChecksum,
      expectedChecksum: '6c6f042d5c5c4ce3c3b3a7e752547ae0'
    });

    const [detailsData, valuationData] = await Promise.all([
      fetchVehicleDetails(apiId, checksum, data.vin),
      fetchValuation(apiId, checksum, data.vin, data.mileage, data.gearbox || 'manual')
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
      mileage: data.mileage,
      rawDetails: detailsData,
      rawValuation: valuationData
    };
  } catch (error) {
    console.error('Valuation error:', error);
    throw error;
  }
}