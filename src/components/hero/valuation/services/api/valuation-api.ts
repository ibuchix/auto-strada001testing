
/**
 * Enhanced valuation API with improved error handling and data extraction
 * 
 * Changes:
 * - 2025-04-17: Improved data normalization and error handling
 * - 2025-04-17: Enhanced debug logging for better troubleshooting
 * - 2025-04-17: Added robust fallback mechanisms for inconsistent API responses
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType } from "../../types";
import { generateRequestId, createPerformanceTracker } from "./utils/debug-utils";

// Define response type for better type safety
interface ValuationResponse {
  data?: {
    make?: string;
    model?: string;
    year?: number;
    valuation?: number;
    averagePrice?: number;
    reservePrice?: number;
    isExisting?: boolean;
    reservationId?: string;
    [key: string]: any;
  };
  error?: Error;
}

/**
 * Fetch valuation data for home page context
 */
export async function fetchHomeValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType
): Promise<ValuationResponse> {
  const requestId = generateRequestId();
  const perfTracker = createPerformanceTracker('home_valuation_api', requestId);
  
  console.group(`[HomeValuationAPI][Detailed Valuation Check]`);
  console.log('Request Parameters:', { 
    vin, 
    mileage, 
    gearbox,
    timestamp: new Date().toISOString(),
    requestId
  });
  
  try {
    perfTracker.checkpoint('api_call_start');
    
    const { data, error } = await supabase.functions.invoke<any>(
      'get-vehicle-valuation',
      {
        body: { 
          vin, 
          mileage, 
          gearbox 
        }
      }
    );
    
    perfTracker.checkpoint('api_call_complete');
    
    console.log('Raw API Response:', { 
      hasData: !!data, 
      hasError: !!error,
      dataKeys: data ? Object.keys(data) : null,
      dataSize: data ? JSON.stringify(data).length : 0
    });
    
    if (error) {
      console.error('Edge Function Error:', error);
      throw new Error(`API error: ${error.message}`);
    }
    
    if (!data) {
      console.warn('No data returned from edge function');
      throw new Error('No valuation data returned');
    }
    
    // Log full API response for debugging (truncated for readability)
    console.log('API Response Excerpt:', JSON.stringify(data).substring(0, 500) + '...');
    
    // Enhanced deep data extraction
    const extractedData = extractVehicleData(data, vin);
    
    console.log('Processed Valuation Data:', {
      make: extractedData.make,
      model: extractedData.model,
      year: extractedData.year,
      valuation: extractedData.valuation,
      reservePrice: extractedData.reservePrice,
      averagePrice: extractedData.averagePrice,
      hasValidMake: !!extractedData.make,
      hasValidModel: !!extractedData.model,
      hasValidYear: !!extractedData.year
    });
    
    console.groupEnd();
    
    return { data: extractedData };
  } catch (error: any) {
    console.error(`Valuation API Error:`, {
      message: error.message,
      stack: error.stack
    });
    console.groupEnd();
    
    return { error: error instanceof Error ? error : new Error(error.message || 'Unknown error') };
  }
}

/**
 * Fetch valuation data for seller context with user authentication
 */
export async function fetchSellerValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType,
  userId: string
): Promise<ValuationResponse> {
  const requestId = generateRequestId();
  const perfTracker = createPerformanceTracker('seller_valuation_api', requestId);
  
  console.log(`[SellerValuationAPI][${requestId}] Fetching valuation for:`, { 
    vin, 
    mileage, 
    gearbox, 
    userId,
    timestamp: new Date().toISOString()
  });
  
  try {
    perfTracker.checkpoint('api_call_start');
    
    // Use the handle-seller-operations edge function
    const { data: response, error } = await supabase.functions.invoke<any>(
      'handle-seller-operations',
      {
        body: {
          operation: 'validate_vin',
          vin,
          mileage,
          gearbox,
          userId
        }
      }
    );
    
    perfTracker.checkpoint('api_call_complete');
    
    // Log full response for debugging
    console.log(`[SellerValuationAPI][${requestId}] Raw API Response:`, {
      hasResponse: !!response,
      responseSize: response ? JSON.stringify(response).length : 0,
      responseKeys: response ? Object.keys(response) : [],
      hasError: !!error,
    });
    
    if (error) {
      console.error(`[SellerValuationAPI][${requestId}] Edge function error:`, {
        message: error.message,
        name: error.name,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
      });
      
      perfTracker.complete('failure', {
        errorType: 'edge_function_error',
        message: error.message
      });
      
      throw new Error(`API error: ${error.message}`);
    }
    
    // Handle specific error format from this endpoint
    if (!response || !response.success) {
      console.error(`[SellerValuationAPI][${requestId}] API response indicates failure:`, {
        error: response?.error || 'No success response received',
        code: response?.errorCode,
        hasResponse: !!response,
        responseKeys: response ? Object.keys(response) : [],
        timestamp: new Date().toISOString()
      });
      
      perfTracker.complete('failure', {
        errorType: 'api_response_failure',
        message: response?.error || 'Failed to validate vehicle'
      });
      
      throw new Error(response?.error || 'Failed to validate vehicle');
    }
    
    // Get the actual data - might be in response.data or directly in response
    const dataToProcess = response.data || response;
    
    // Log the response data structure
    console.log(`[SellerValuationAPI][${requestId}] Response structure:`, {
      hasDataProperty: !!response.data,
      dataPropertyKeys: response.data ? Object.keys(response.data) : [],
      topLevelKeys: Object.keys(response),
      hasVehicleInfo: !!(dataToProcess.make && dataToProcess.model),
      hasHiddenVehicleInfo: findNestedValue(dataToProcess, 'make') !== undefined
    });
    
    // Enhanced deep data extraction with improved property path finding
    const extractedData = extractVehicleData(dataToProcess, vin);
    
    // Add the vin to make sure it's always available
    extractedData.vin = vin;
    
    // Calculate reserve price if not provided
    if (extractedData && extractedData.valuation && !extractedData.reservePrice) {
      extractedData.reservePrice = calculateReservePrice(extractedData.valuation);
      console.log(`[SellerValuationAPI][${requestId}] Calculated reserve price:`, {
        reservePrice: extractedData.reservePrice,
        baseValue: extractedData.valuation,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`[SellerValuationAPI][${requestId}] Extracted vehicle data:`, {
      make: extractedData.make,
      model: extractedData.model,
      year: extractedData.year,
      valuation: extractedData.valuation,
      reservePrice: extractedData.reservePrice,
      isComplete: !!(extractedData.make && extractedData.model && extractedData.year)
    });
    
    perfTracker.complete('success', { 
      dataReceived: true,
      hasVehicleDetails: !!(extractedData.make && extractedData.model),
      processingTimeMs: perfTracker.checkpoint('processing_complete'),
      timestamp: new Date().toISOString()
    });
    
    return { data: extractedData };
  } catch (error: any) {
    console.error(`[SellerValuationAPI][${requestId}] Error fetching seller valuation:`, {
      message: error.message,
      stack: error.stack,
      vin,
      mileage,
      userId,
      timestamp: new Date().toISOString()
    });
    
    perfTracker.complete('failure', {
      errorType: error.constructor?.name,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    return { error: error instanceof Error ? error : new Error(error.message || 'Unknown error') };
  }
}

/**
 * Enhanced function to extract vehicle data from potentially nested API response
 */
function extractVehicleData(data: any, vin: string): any {
  // If the data is null or undefined, return an empty object
  if (!data) return {};
  
  // Check if data is nested inside a data property
  const vehicleData = data.data || data;
  
  // Extract make with multiple potential paths
  const make = 
    vehicleData.make || 
    findNestedValue(vehicleData, 'make') || 
    vehicleData.manufacturer || 
    findNestedValue(vehicleData, 'manufacturer') || 
    vehicleData.brand || 
    findNestedValue(vehicleData, 'brand');
  
  // Extract model with multiple potential paths
  const model = 
    vehicleData.model || 
    findNestedValue(vehicleData, 'model') || 
    vehicleData.modelName || 
    findNestedValue(vehicleData, 'modelName');
  
  // Extract year with multiple potential paths
  const year = 
    vehicleData.year || 
    findNestedValue(vehicleData, 'year') || 
    vehicleData.productionYear || 
    findNestedValue(vehicleData, 'productionYear');
  
  // Extract price data with multiple potential paths
  const valuation = 
    vehicleData.valuation || 
    findNestedValue(vehicleData, 'valuation') || 
    vehicleData.price || 
    findNestedValue(vehicleData, 'price') || 
    vehicleData.price_med || 
    findNestedValue(vehicleData, 'price_med');
  
  // Extract reserve price with multiple potential paths
  const reservePrice = 
    vehicleData.reservePrice || 
    findNestedValue(vehicleData, 'reservePrice');
  
  // Extract average price with multiple potential paths
  const averagePrice = 
    vehicleData.averagePrice || 
    findNestedValue(vehicleData, 'averagePrice') || 
    vehicleData.price_med || 
    findNestedValue(vehicleData, 'price_med');
  
  // Create the result object with all extracted data
  const result = {
    make,
    model,
    year: year ? Number(year) : undefined,
    vin,
    valuation: valuation ? Number(valuation) : undefined,
    reservePrice: reservePrice ? Number(reservePrice) : (valuation ? calculateReservePrice(Number(valuation)) : undefined),
    averagePrice: averagePrice ? Number(averagePrice) : undefined,
    
    // Include original data for reference
    originalData: vehicleData
  };
  
  return result;
}

/**
 * Recursively find a value in a nested object structure by key
 */
function findNestedValue(obj: any, key: string): any {
  // Handle null/undefined
  if (!obj) return undefined;
  
  // Direct match
  if (obj[key] !== undefined) {
    return obj[key];
  }
  
  // Search in nested objects
  for (const prop in obj) {
    if (obj[prop] && typeof obj[prop] === 'object') {
      const found = findNestedValue(obj[prop], key);
      if (found !== undefined) {
        return found;
      }
    }
  }
  
  return undefined;
}

/**
 * Calculate reserve price based on valuation using the specified formula
 */
function calculateReservePrice(valuation: number): number {
  // Price tiers and corresponding percentages
  const tiers = [
    { max: 15000, percentage: 0.65 },
    { max: 20000, percentage: 0.46 },
    { max: 30000, percentage: 0.37 },
    { max: 50000, percentage: 0.27 },
    { max: 60000, percentage: 0.27 },
    { max: 70000, percentage: 0.22 },
    { max: 80000, percentage: 0.23 },
    { max: 100000, percentage: 0.24 },
    { max: 130000, percentage: 0.20 },
    { max: 160000, percentage: 0.185 },
    { max: 200000, percentage: 0.22 },
    { max: 250000, percentage: 0.17 },
    { max: 300000, percentage: 0.18 },
    { max: 400000, percentage: 0.18 },
    { max: 500000, percentage: 0.16 },
    { max: Infinity, percentage: 0.145 }
  ];
  
  // Find the correct tier
  const tier = tiers.find(t => valuation <= t.max);
  const percentage = tier ? tier.percentage : 0.145; // Default to lowest percentage
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = valuation - (valuation * percentage);
  
  return Math.round(reservePrice); // Round to nearest whole number
}
