
/**
 * Data validation utilities for valuation responses
 * Created: 2025-05-05 - Added comprehensive validation and error handling
 */

interface ValidationError {
  code: string;
  message: string;
  path?: string;
  value?: any;
}

export function validateValuationResponse(data: any): { 
  isValid: boolean; 
  errors: ValidationError[]; 
  data?: any;
} {
  const errors: ValidationError[] = [];
  
  // Step 1: Validate raw response
  if (!data) {
    errors.push({
      code: 'EMPTY_RESPONSE',
      message: 'No data received from valuation service'
    });
    return { isValid: false, errors };
  }

  // Step 2: Parse if string
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
      console.log('[VALIDATION] Successfully parsed JSON string response');
    } catch (e) {
      errors.push({
        code: 'PARSE_ERROR',
        message: 'Failed to parse API response as JSON',
        value: data.substring(0, 100) + '...' // Log first 100 chars for debugging
      });
      return { isValid: false, errors };
    }
  }

  // Step 3: Validate functionResponse structure
  if (!parsedData.functionResponse) {
    errors.push({
      code: 'MISSING_FUNCTION_RESPONSE',
      message: 'Response missing functionResponse object',
      value: Object.keys(parsedData)
    });
    return { isValid: false, errors };
  }

  // Step 4: Validate userParams
  const userParams = parsedData.functionResponse.userParams;
  if (!userParams) {
    errors.push({
      code: 'MISSING_USER_PARAMS',
      message: 'Response missing userParams object',
      path: 'functionResponse.userParams'
    });
  } else {
    // Validate required vehicle fields
    const requiredFields = ['make', 'model', 'year'];
    for (const field of requiredFields) {
      if (!userParams[field]) {
        errors.push({
          code: 'MISSING_VEHICLE_DATA',
          message: `Missing required vehicle field: ${field}`,
          path: `functionResponse.userParams.${field}`
        });
      }
    }

    // Validate data types
    if (userParams.year && typeof userParams.year !== 'number') {
      errors.push({
        code: 'INVALID_YEAR_TYPE',
        message: 'Year must be a number',
        path: 'functionResponse.userParams.year',
        value: userParams.year
      });
    }
  }

  // Step 5: Validate calcValuation
  const calcValuation = parsedData.functionResponse?.valuation?.calcValuation;
  if (!calcValuation) {
    errors.push({
      code: 'MISSING_CALC_VALUATION',
      message: 'Response missing calcValuation object',
      path: 'functionResponse.valuation.calcValuation'
    });
  } else {
    // Validate required price fields
    const requiredPriceFields = ['price_min', 'price_med'];
    for (const field of requiredPriceFields) {
      if (!calcValuation[field]) {
        errors.push({
          code: 'MISSING_PRICE_DATA',
          message: `Missing required price field: ${field}`,
          path: `functionResponse.valuation.calcValuation.${field}`
        });
      }
      // Validate price values are numbers and positive
      if (calcValuation[field] && (
        typeof calcValuation[field] !== 'number' || 
        calcValuation[field] <= 0
      )) {
        errors.push({
          code: 'INVALID_PRICE_DATA',
          message: `Invalid ${field} value: must be a positive number`,
          path: `functionResponse.valuation.calcValuation.${field}`,
          value: calcValuation[field]
        });
      }
    }
  }

  // Return validation result
  const isValid = errors.length === 0;
  return {
    isValid,
    errors,
    data: isValid ? {
      make: userParams?.make,
      model: userParams?.model,
      year: userParams?.year,
      price_min: calcValuation?.price_min,
      price_med: calcValuation?.price_med,
      transmission: userParams?.gearbox || 'manual',
      rawResponse: parsedData // Include raw response for debugging
    } : undefined
  };
}

