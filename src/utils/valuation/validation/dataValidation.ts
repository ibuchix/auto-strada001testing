
/**
 * Data validation utilities for valuation responses
 * Updated: 2025-05-06 - Added detailed step-by-step logging of validation process
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
  const requestId = Math.random().toString(36).substring(2, 10);
  
  console.group(`[VALIDATION][${requestId}] Starting validation of response data`);
  console.log(`[VALIDATION][${requestId}] Raw data type:`, typeof data);
  
  // Step 1: Validate raw response
  if (!data) {
    console.error(`[VALIDATION][${requestId}] No data received`);
    errors.push({
      code: 'EMPTY_RESPONSE',
      message: 'No data received from valuation service'
    });
    console.groupEnd();
    return { isValid: false, errors };
  }

  // Step 2: Parse if string
  let parsedData = data;
  if (typeof data === 'string') {
    console.log(`[VALIDATION][${requestId}] Received string data, attempting to parse as JSON`);
    console.log(`[VALIDATION][${requestId}] String sample:`, data.substring(0, 100) + '...');
    
    try {
      parsedData = JSON.parse(data);
      console.log(`[VALIDATION][${requestId}] Successfully parsed JSON string response`);
      console.log(`[VALIDATION][${requestId}] Parsed data keys:`, Object.keys(parsedData));
    } catch (e) {
      console.error(`[VALIDATION][${requestId}] Failed to parse as JSON:`, e);
      errors.push({
        code: 'PARSE_ERROR',
        message: 'Failed to parse API response as JSON',
        value: data.substring(0, 100) + '...' // Log first 100 chars for debugging
      });
      console.groupEnd();
      return { isValid: false, errors };
    }
  }

  // Step 3: Validate functionResponse structure
  console.log(`[VALIDATION][${requestId}] Checking for functionResponse object`);
  if (!parsedData.functionResponse) {
    console.error(`[VALIDATION][${requestId}] Missing functionResponse object`);
    errors.push({
      code: 'MISSING_FUNCTION_RESPONSE',
      message: 'Response missing functionResponse object',
      value: Object.keys(parsedData)
    });
    console.groupEnd();
    return { isValid: false, errors };
  } else {
    console.log(`[VALIDATION][${requestId}] functionResponse object found with keys:`, Object.keys(parsedData.functionResponse));
  }

  // Step 4: Validate userParams
  console.log(`[VALIDATION][${requestId}] Checking for userParams object`);
  const userParams = parsedData.functionResponse.userParams;
  if (!userParams) {
    console.error(`[VALIDATION][${requestId}] Missing userParams object`);
    errors.push({
      code: 'MISSING_USER_PARAMS',
      message: 'Response missing userParams object',
      path: 'functionResponse.userParams'
    });
  } else {
    console.log(`[VALIDATION][${requestId}] userParams found with keys:`, Object.keys(userParams));
    
    // Validate required vehicle fields
    const requiredFields = ['make', 'model', 'year'];
    for (const field of requiredFields) {
      console.log(`[VALIDATION][${requestId}] Checking required field: ${field} = ${userParams[field]}`);
      if (!userParams[field]) {
        console.error(`[VALIDATION][${requestId}] Missing required field: ${field}`);
        errors.push({
          code: 'MISSING_VEHICLE_DATA',
          message: `Missing required vehicle field: ${field}`,
          path: `functionResponse.userParams.${field}`
        });
      }
    }

    // Validate data types
    if (userParams.year && typeof userParams.year !== 'number') {
      console.warn(`[VALIDATION][${requestId}] Invalid year type: ${typeof userParams.year}, value: ${userParams.year}`);
      errors.push({
        code: 'INVALID_YEAR_TYPE',
        message: 'Year must be a number',
        path: 'functionResponse.userParams.year',
        value: userParams.year
      });
    }
  }

  // Step 5: Validate calcValuation
  console.log(`[VALIDATION][${requestId}] Checking for calcValuation object`);
  const calcValuation = parsedData.functionResponse?.valuation?.calcValuation;
  if (!calcValuation) {
    console.error(`[VALIDATION][${requestId}] Missing calcValuation object`);
    console.log(`[VALIDATION][${requestId}] Valuation structure:`, {
      hasValuation: !!parsedData.functionResponse?.valuation,
      valuationKeys: parsedData.functionResponse?.valuation ? Object.keys(parsedData.functionResponse.valuation) : []
    });
    
    errors.push({
      code: 'MISSING_CALC_VALUATION',
      message: 'Response missing calcValuation object',
      path: 'functionResponse.valuation.calcValuation'
    });
  } else {
    console.log(`[VALIDATION][${requestId}] calcValuation found with keys:`, Object.keys(calcValuation));
    
    // Validate required price fields
    const requiredPriceFields = ['price_min', 'price_med'];
    for (const field of requiredPriceFields) {
      console.log(`[VALIDATION][${requestId}] Checking required price field: ${field} = ${calcValuation[field]}`);
      if (calcValuation[field] === undefined) {
        console.error(`[VALIDATION][${requestId}] Missing required price field: ${field}`);
        errors.push({
          code: 'MISSING_PRICE_DATA',
          message: `Missing required price field: ${field}`,
          path: `functionResponse.valuation.calcValuation.${field}`
        });
      }
      
      // Validate price values are numbers and positive
      if (calcValuation[field] !== undefined && (
        typeof calcValuation[field] !== 'number' || 
        calcValuation[field] <= 0
      )) {
        console.error(`[VALIDATION][${requestId}] Invalid price value for ${field}:`, calcValuation[field]);
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
  console.log(`[VALIDATION][${requestId}] Validation complete - isValid: ${isValid}, errors: ${errors.length}`);
  
  let validatedData = undefined;
  if (isValid) {
    validatedData = {
      make: userParams?.make,
      model: userParams?.model,
      year: userParams?.year,
      price_min: calcValuation?.price_min,
      price_med: calcValuation?.price_med,
      transmission: userParams?.gearbox || 'manual',
      rawResponse: parsedData // Include raw response for debugging
    };
    console.log(`[VALIDATION][${requestId}] Validated data:`, validatedData);
  }
  
  console.groupEnd();
  return {
    isValid,
    errors,
    data: validatedData
  };
}
