import { calculateChecksum } from "../utils/checksum.ts";
import { ValuationRequest, ValuationResponse } from "../types.ts";
import { extractVehicleDetails } from "../utils/vehicleDataExtractor.ts";

const API_BASE_URL = 'https://bp.autoiso.pl/api/v3';

async function fetchVehicleDetails(apiId: string, checksum: string, vin: string) {
  const detailsUrl = `${API_BASE_URL}/getVinDetails/apiuid:${apiId}/checksum:${checksum}/vin:${vin}`;
  console.log('Fetching vehicle details from:', detailsUrl);
  
  try {
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
        errorText,
        url: detailsUrl
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

async function fetchValuation(apiId: string, checksum: string, vin: string, mileage: number, gearbox: string) {
  const valuationUrl = `${API_BASE_URL}/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox}/currency:PLN`;
  console.log('Fetching valuation from:', valuationUrl);
  
  try {
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
        errorText,
        url: valuationUrl
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

  const apiId = 'AUTOSTRA';
  const apiSecret = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
  
  if (!data.vin || typeof data.vin !== 'string' || data.vin.length < 11) {
    console.error('Invalid VIN format:', data.vin);
    throw new Error('Invalid VIN format');
  }

  if (!data.mileage || isNaN(data.mileage) || data.mileage < 0) {
    console.error('Invalid mileage value:', data.mileage);
    throw new Error('Invalid mileage value');
  }

  try {
    const checksum = await calculateChecksum(apiId, apiSecret, data.vin);
    console.log('Calculated checksum:', checksum);

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