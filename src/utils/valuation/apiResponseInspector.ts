
/**
 * API Response Inspector Utility
 * Created: 2025-04-25
 * 
 * This utility inspects API responses to help debug issues with data extraction.
 */

/**
 * Inspect an API response and log useful debugging information
 */
export function inspectApiResponse(response: any, source: string = 'UNKNOWN'): void {
  console.group(`[${source}] API Response Inspection`);
  
  // Check if response exists
  if (!response) {
    console.error(`[${source}] Empty response received`);
    console.groupEnd();
    return;
  }
  
  // Log basic structure
  console.log(`[${source}] Response type:`, typeof response);
  console.log(`[${source}] Top-level keys:`, Object.keys(response));
  
  // Check for error
  if (response.error) {
    console.error(`[${source}] Error found in response:`, response.error);
  }
  
  // Check for functionResponse structure (main data path)
  if (response.functionResponse) {
    console.log(`[${source}] functionResponse exists with keys:`, Object.keys(response.functionResponse));
    
    const valuation = response.functionResponse.valuation;
    if (valuation) {
      console.log(`[${source}] valuation object exists with keys:`, Object.keys(valuation));
      
      if (valuation.calcValuation) {
        console.log(`[${source}] calcValuation found:`, valuation.calcValuation);
      } else {
        console.warn(`[${source}] calcValuation missing from valuation object`);
      }
    } else {
      console.warn(`[${source}] valuation object missing from functionResponse`);
    }
  } else {
    console.warn(`[${source}] functionResponse missing from API response`);
  }
  
  // Check for direct price fields
  const priceFields = ['price_min', 'price_med', 'price_max', 'basePrice', 'valuation', 'reservePrice'];
  const foundPriceFields = priceFields.filter(field => response[field] !== undefined);
  
  if (foundPriceFields.length > 0) {
    console.log(`[${source}] Direct price fields found:`, 
      foundPriceFields.reduce((acc: any, field) => {
        acc[field] = response[field];
        return acc;
      }, {})
    );
  } else {
    console.warn(`[${source}] No direct price fields found at top level`);
  }
  
  console.groupEnd();
}
