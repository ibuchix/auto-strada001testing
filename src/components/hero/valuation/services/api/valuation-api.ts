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
      dataKeys: data ? Object.keys(data) : null
    });
    
    if (error) {
      console.error('Edge Function Error:', error);
      throw new Error(`API error: ${error.message}`);
    }
    
    if (!data) {
      console.warn('No data returned from edge function');
      throw new Error('No valuation data returned');
    }
    
    console.log('Processed Valuation Data:', {
      make: data.make,
      model: data.model,
      year: data.year,
      valuation: data.valuation,
      reservePrice: data.reservePrice
    });
    
    console.groupEnd();
    
    return { data };
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
    
    // Check if data is missing or invalid
    if (!response.data || Object.keys(response.data).length === 0) {
      console.error(`[SellerValuationAPI][${requestId}] Missing data in successful response:`, {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        timestamp: new Date().toISOString()
      });
      
      perfTracker.complete('failure', {
        errorType: 'missing_data',
        message: 'No data found in the successful response'
      });
      
      throw new Error('No data found for this VIN');
    }
    
    console.log(`[SellerValuationAPI][${requestId}] Received seller valuation data:`, {
      make: response.data?.make,
      model: response.data?.model,
      year: response.data?.year,
      hasValuation: !!response.data?.valuation,
      hasReservePrice: !!response.data?.reservePrice,
      propertiesCount: response.data ? Object.keys(response.data).length : 0,
      timestamp: new Date().toISOString()
    });
    
    // Calculate reserve price if not provided
    if (response.data && response.data.valuation && !response.data.reservePrice) {
      response.data.reservePrice = calculateReservePrice(response.data.valuation);
      console.log(`[SellerValuationAPI][${requestId}] Calculated reserve price:`, {
        reservePrice: response.data.reservePrice,
        baseValue: response.data.valuation,
        timestamp: new Date().toISOString()
      });
    }
    
    perfTracker.complete('success', { 
      dataReceived: true,
      withCalculation: !!(response.data && response.data.valuation && !response.data.reservePrice),
      processingTimeMs: perfTracker.checkpoint('processing_complete'),
      timestamp: new Date().toISOString()
    });
    
    return { data: response.data };
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
