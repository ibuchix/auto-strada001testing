
/**
 * Enhanced VIN Debugging Utility
 * Created: 2025-04-20
 * Purpose: Provides detailed logging throughout the VIN check process to identify data transformation issues
 */

interface VehicleDebugData {
  make?: string;
  model?: string;
  year?: number | string;
  vin?: string;
  transmission?: string;
  mileage?: number;
  price?: number;
  valuation?: number;
  reservePrice?: number;
}

interface ApiCallMetrics {
  requestId: string;
  startTime: number;
  endTime?: number;
  success?: boolean;
  errorType?: string;
  stage: string;
}

const apiCallMetrics = new Map<string, ApiCallMetrics>();

/**
 * Detailed API response logger for debugging VIN check issues
 */
export function debugVinApiResponse(stage: string, data: any): void {
  console.group(`[VIN_DEBUG][${stage.toUpperCase()}] ${new Date().toISOString()}`);
  
  try {
    // Log basic info
    console.log('Basic data:', {
      hasData: !!data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      topLevelKeys: data ? Object.keys(data) : 'N/A'
    });
    
    // Extract and log vehicle details
    const vehicleDetails = {
      make: data?.make || 'MISSING',
      model: data?.model || 'MISSING',
      year: data?.year || data?.productionYear || 'MISSING',
      vin: data?.vin || 'MISSING',
      transmission: data?.transmission || data?.gearbox || 'MISSING'
    };
    console.log('Vehicle details:', vehicleDetails);
    
    // Extract and log all price-related fields
    const priceFields: Record<string, any> = {};
    if (data && typeof data === 'object') {
      // Check direct price fields
      for (const [key, value] of Object.entries(data)) {
        if (
          (key.toLowerCase().includes('price') || 
           key.toLowerCase().includes('value') ||
           key.toLowerCase().includes('valuation')) && 
          (typeof value === 'number' || typeof value === 'string')
        ) {
          priceFields[key] = value;
        }
      }
      
      // Check nested objects for price fields
      const nestedObjects = ['valuationDetails', 'data', 'apiData', 'result', 'response'];
      for (const nestedKey of nestedObjects) {
        if (data[nestedKey] && typeof data[nestedKey] === 'object') {
          for (const [key, value] of Object.entries(data[nestedKey])) {
            if (
              (key.toLowerCase().includes('price') || 
               key.toLowerCase().includes('value') ||
               key.toLowerCase().includes('valuation')) && 
              (typeof value === 'number' || typeof value === 'string')
            ) {
              priceFields[`${nestedKey}.${key}`] = value;
            }
          }
        }
      }
    }
    console.log('Price-related fields:', priceFields);
    
    // Check data quality
    const dataQualityScore = calculateDataQualityScore(data);
    console.log('Data quality score:', dataQualityScore);
    
    // Log the full data structure for reference (limited depth)
    console.log('Full data structure:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error in debugVinApiResponse:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Debug valuation calculation process
 */
export function debugValuationCalculation(
  basePrice: number,
  finalPrice: number,
  calculation: { [key: string]: any }
): void {
  console.group('[VIN_DEBUG][VALUATION_CALCULATION]');
  try {
    console.log('Calculation inputs:', {
      basePrice,
      timestamp: new Date().toISOString()
    });
    
    console.log('Calculation details:', calculation);
    
    console.log('Final result:', {
      finalPrice,
      difference: finalPrice - basePrice,
      percentageChange: ((finalPrice - basePrice) / basePrice) * 100
    });
  } catch (error) {
    console.error('Error in debugValuationCalculation:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Debug UI rendering with valuation data
 */
export function debugUiRendering(componentName: string, props: any): void {
  console.group(`[VIN_DEBUG][UI_RENDER][${componentName}]`);
  try {
    console.log('Render timestamp:', new Date().toISOString());
    console.log('Component props:', {
      hasData: !!props,
      propsKeys: Object.keys(props),
      valuationPresent: !!props.valuation || !!props.pricing
    });
    
    if (props.error) {
      console.warn('Error present in props:', props.error);
    }
  } catch (error) {
    console.error('Error in debugUiRendering:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Track API call timing and results
 */
export function trackVinApiCall(requestId: string, stage: string): void {
  if (stage === 'start') {
    apiCallMetrics.set(requestId, {
      requestId,
      startTime: performance.now(),
      stage: 'started'
    });
  } else if (stage === 'end') {
    const metrics = apiCallMetrics.get(requestId);
    if (metrics) {
      metrics.endTime = performance.now();
      metrics.stage = 'completed';
      
      console.log('[VIN_DEBUG][API_METRICS]', {
        requestId,
        duration: metrics.endTime - metrics.startTime,
        success: metrics.success,
        errorType: metrics.errorType
      });
    }
  }
}

/**
 * Calculate data quality score
 */
function calculateDataQualityScore(data: any): number {
  if (!data) return 0;
  
  let score = 0;
  let totalChecks = 0;
  
  // Check essential fields
  const essentialFields = ['make', 'model', 'year', 'vin'];
  for (const field of essentialFields) {
    if (data[field]) {
      score++;
    }
    totalChecks++;
  }
  
  // Check price data
  if (
    data.price_min !== undefined || 
    data.price_med !== undefined || 
    data.valuation !== undefined
  ) {
    score++;
  }
  totalChecks++;
  
  // Check for fallback values
  if (data.usedFallback || data.usedDefaultPrice) {
    score -= 0.5;
  }
  
  return totalChecks > 0 ? Math.max(0, score / totalChecks) : 0;
}

/**
 * Debug API request parameters
 */
export function debugApiRequest(vin: string, params: any): void {
  console.group('[VIN_DEBUG][API_REQUEST]');
  try {
    console.log('Request parameters:', {
      vin,
      timestamp: new Date().toISOString(),
      params
    });
    
    // Validate VIN format
    const vinValid = /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
    console.log('VIN validation:', {
      isValid: vinValid,
      length: vin.length,
      format: vinValid ? 'valid' : 'invalid'
    });
  } catch (error) {
    console.error('Error in debugApiRequest:', error);
  } finally {
    console.groupEnd();
  }
}
