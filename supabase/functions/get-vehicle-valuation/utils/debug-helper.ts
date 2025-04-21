
/**
 * Debug helpers for get-vehicle-valuation
 * Created: 2025-04-25 - For diagnosing API connection issues
 * Updated: 2025-04-28 - Enhanced credential and endpoint debugging
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
    apiSecretSuffix: apiSecret ? '...' + apiSecret.substring(apiSecret.length - 4) : null,
    timestamp: new Date().toISOString()
  });
  
  // Check if we have the right environment keys configured
  const allEnvKeys = Object.keys(Deno.env.toObject());
  const relevantEnvKeys = allEnvKeys.filter(key => 
    key.includes('API') || 
    key.includes('SECRET') || 
    key.includes('KEY') ||
    key.includes('VALUATION') ||
    key.includes('CAR')
  );
  
  logOperation('environment_check', {
    requestId,
    totalEnvVars: allEnvKeys.length,
    relevantEnvCount: relevantEnvKeys.length,
    relevantKeys: relevantEnvKeys
  });
  
  // Directly verify the default API ID we're using
  logOperation('api_id_verification', {
    requestId,
    usingDefault: apiId === 'AUTOSTRA',
    value: apiId
  });
  
  return {
    valid: hasApiId && hasApiSecret,
    details: {
      hasApiId,
      hasApiSecret,
      apiIdValue: apiId,
      apiSecretLength,
      envVarCount: allEnvKeys.length,
      relevantEnvVars: relevantEnvKeys
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
  
  // Create a debug message for the URL
  logOperation('debug_api_endpoint', {
    requestId,
    mockUrl,
    vin,
    mileage,
    apiId,
    timestamp: new Date().toISOString()
  });
  
  // Verify VIN formatting
  const isValidVinFormat = /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
  logOperation('vin_format_check', {
    requestId,
    vin,
    isValidFormat: isValidVinFormat,
    length: vin.length
  });
  
  // Check for common VIN or API issues
  if (vin.length !== 17) {
    logOperation('vin_length_error', {
      requestId,
      vinLength: vin.length,
      vin
    }, 'error');
  }
  
  if (!isValidVinFormat) {
    logOperation('vin_format_error', {
      requestId,
      vin,
      invalidChars: vin.match(/[^A-HJ-NPR-Z0-9]/gi) || []
    }, 'error');
  }
}

/**
 * Verify response data structure against expectations
 */
export function verifyResponseStructure(data: any, requestId: string): {
  isValid: boolean,
  issues: string[]
} {
  const issues: string[] = [];
  
  if (!data) {
    issues.push('Response data is null or undefined');
    return { isValid: false, issues };
  }
  
  // Check for vehicle basic information
  if (!data.make) issues.push('Missing make');
  if (!data.model) issues.push('Missing model');
  if (!data.year || data.year <= 0) issues.push('Missing or invalid year');
  
  // Check for price information
  const hasPricing = !!(
    data.price_min > 0 || 
    data.price_med > 0 || 
    data.valuation > 0 || 
    data.basePrice > 0 ||
    data.reservePrice > 0
  );
  
  if (!hasPricing) issues.push('Missing all pricing data');
  
  // Log the verification results
  logOperation('response_verification', {
    requestId,
    hasBasicInfo: !!(data.make && data.model && data.year),
    hasPricing,
    issueCount: issues.length,
    issues
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
