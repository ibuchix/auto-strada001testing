
/**
 * API Response Inspector Utility
 * Created: 2025-04-24
 * Purpose: Deep inspection of API responses to ensure proper data extraction
 */

export function inspectApiResponse(data: any, source: string) {
  console.group(`[${source}] API Response Inspection`);
  
  // Log complete raw response
  console.log('Complete raw response:', JSON.stringify(data, null, 2));
  
  // Analyze structure
  console.log('Response structure:', {
    hasData: !!data,
    topLevelKeys: data ? Object.keys(data) : [],
    hasFunctionResponse: !!data?.functionResponse,
    hasValuation: !!data?.functionResponse?.valuation,
    hasCalcValuation: !!data?.functionResponse?.valuation?.calcValuation
  });
  
  // If we have calcValuation, inspect it
  if (data?.functionResponse?.valuation?.calcValuation) {
    const calcValuation = data.functionResponse.valuation.calcValuation;
    console.log('CalcValuation data found:', {
      price_min: calcValuation.price_min,
      price_med: calcValuation.price_med,
      price: calcValuation.price,
      hasValidPrices: typeof calcValuation.price_min === 'number' && 
                     typeof calcValuation.price_med === 'number'
    });
  } else {
    console.warn('No calcValuation data found in response');
  }
  
  console.groupEnd();
}
