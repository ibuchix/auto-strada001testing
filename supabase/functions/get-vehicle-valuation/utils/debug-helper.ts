
/**
 * Debug helpers for get-vehicle-valuation
 * Created: 2025-04-25 - For diagnosing API connection issues
 */

import { logOperation } from './logging.ts';

/**
 * Check if API credentials are properly configured
 */
export function checkApiCredentials(requestId: string): { valid: boolean, details: any } {
  const apiId = Deno.env.get("VALUATION_API_ID") || "AUTOSTRA";
  const apiSecret = Deno.env.get("VALUATION_API_SECRET") || Deno.env.get("CAR_API_SECRET");
  
  const hasApiId = !!apiId;
  const hasApiSecret = !!apiSecret;
  const apiSecretLength = apiSecret ? apiSecret.length : 0;
  
  // Log credential status without revealing the actual secrets
  logOperation('checking_api_credentials', {
    requestId,
    hasApiId,
    hasApiSecret,
    apiIdValue: apiId,
    apiSecretLength,
    apiSecretPrefix: apiSecret ? apiSecret.substring(0, 4) + '...' : null,
    apiSecretSuffix: apiSecret ? '...' + apiSecret.substring(apiSecret.length - 4) : null
  });
  
  return {
    valid: hasApiId && hasApiSecret,
    details: {
      hasApiId,
      hasApiSecret,
      apiIdValue: apiId,
      apiSecretLength,
      envVars: Object.keys(Deno.env.toObject()).filter(key => 
        key.includes('API') || 
        key.includes('SECRET') || 
        key.includes('KEY') ||
        key.includes('VALUATION') ||
        key.includes('CAR')
      )
    }
  };
}

/**
 * Print debug information about the endpoint we're calling
 */
export function debugApiEndpoint(vin: string, mileage: number, requestId: string): void {
  const apiId = Deno.env.get("VALUATION_API_ID") || "AUTOSTRA";
  
  // Generate a mock URL (without the actual checksum which requires the secret)
  const mockUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:XXXX-SAMPLE-CHECKSUM-XXXX/vin:${vin}/odometer:${mileage}/currency:PLN`;
  
  logOperation('debug_api_endpoint', {
    requestId,
    mockUrl,
    vin,
    mileage,
    apiId
  });
}
