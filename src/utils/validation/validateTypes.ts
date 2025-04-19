
/**
 * Type validation utilities
 * Created: 2025-04-19
 */

export function isValidTransmissionType(transmission: unknown): transmission is 'manual' | 'automatic' {
  return typeof transmission === 'string' && ['manual', 'automatic'].includes(transmission as string);
}

export function normalizeTransmission(transmission: unknown): 'manual' | 'automatic' {
  if (isValidTransmissionType(transmission)) {
    return transmission;
  }
  console.warn('Invalid transmission type provided:', transmission);
  return 'manual'; // Default fallback
}

export function validateValuationData(data: any) {
  console.log('Validating valuation data:', {
    hasData: !!data,
    dataFields: data ? Object.keys(data) : [],
    make: data?.make,
    model: data?.model,
    year: data?.year,
    timestamp: new Date().toISOString()
  });

  if (!data) {
    console.warn('No valuation data provided');
    return false;
  }

  const hasRequiredFields = !!(
    data.make && 
    data.model && 
    typeof data.year === 'number'
  );

  console.log('Validation result:', {
    hasRequiredFields,
    make: !!data.make,
    model: !!data.model,
    validYear: typeof data.year === 'number'
  });

  return hasRequiredFields;
}
