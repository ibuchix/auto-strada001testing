
/**
 * Debug helper utilities for get-vehicle-valuation
 * Added: 2025-04-24 - Improved environment variable checking and debugging
 */

import { logOperation } from "./logging.ts";

export function checkApiCredentials(requestId: string): { valid: boolean, details: Record<string, any> } {
  const apiId = Deno.env.get('VALUATION_API_ID') || Deno.env.get('CAR_API_ID');
  const apiSecret = Deno.env.get('VALUATION_API_SECRET') || Deno.env.get('CAR_API_SECRET');
  
  const details: Record<string, any> = {
    hasApiId: !!apiId,
    hasApiSecret: !!apiSecret,
    apiIdSource: apiId ? (Deno.env.get('VALUATION_API_ID') ? 'VALUATION_API_ID' : 'CAR_API_ID') : 'none',
    apiSecretSource: apiSecret ? (Deno.env.get('VALUATION_API_SECRET') ? 'VALUATION_API_SECRET' : 'CAR_API_SECRET') : 'none',
  };
  
  // Log detailed information about available environment variables
  logOperation('environment_check', {
    requestId,
    availableEnvVars: Object.keys(Deno.env.toObject()),
    valApiId: Deno.env.get('VALUATION_API_ID')?.substring(0, 3) + '***',
    carApiId: Deno.env.get('CAR_API_ID')?.substring(0, 3) + '***',
    hasValSecret: !!Deno.env.get('VALUATION_API_SECRET'),
    hasCarSecret: !!Deno.env.get('CAR_API_SECRET'),
  });
  
  return { 
    valid: !!apiId && !!apiSecret,
    details
  };
}

export function debugApiEndpoint(vin: string, mileage: number, requestId: string): void {
  const apiId = Deno.env.get('VALUATION_API_ID') || Deno.env.get('CAR_API_ID') || 'MISSING_API_ID';
  const apiSecret = Deno.env.get('VALUATION_API_SECRET') || Deno.env.get('CAR_API_SECRET') || 'MISSING_API_SECRET';
  
  // Calculate a fake checksum for logging (don't include actual API secret)
  const fakeChecksumContent = apiId + "***SECRET***" + vin;
  const fakeChecksum = "checksum-would-be-calculated-here";
  
  const sampleUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${fakeChecksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
  
  logOperation('api_debug_endpoint', {
    requestId,
    sampleUrl,
    using: {
      apiId: apiId,
      apiIdSource: Deno.env.get('VALUATION_API_ID') ? 'VALUATION_API_ID' : 'CAR_API_ID',
      secretSource: Deno.env.get('VALUATION_API_SECRET') ? 'VALUATION_API_SECRET' : 'CAR_API_SECRET'
    }
  });
}
