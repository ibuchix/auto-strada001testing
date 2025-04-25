
/**
 * Vehicle data extraction utility
 * Created: 2025-05-01
 * Updated: 2025-04-25 - Completely rewritten to properly handle nested JSON structure
 */

/**
 * Extract basic vehicle data from the API response
 * Directly accesses the nested structure from functionResponse.userParams
 */
export function extractVehicleData(rawData: any): any {
  // First check if we have a string response that needs parsing
  let data = rawData;
  if (typeof rawData === 'string') {
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      console.error('Failed to parse raw JSON string:', e);
      return {};
    }
  }

  // Access the nested userParams directly
  const userParams = data?.functionResponse?.userParams || {};
  
  console.log('[DATA-EXTRACTOR] Accessing userParams:', userParams);
  
  return {
    make: userParams.make || '',
    model: userParams.model || '',
    year: Number(userParams.year) || new Date().getFullYear(),
    vin: data.vin || '',
    transmission: userParams.gearbox || 'manual',
    mileage: Number(userParams.odometer) || 0
  };
}
