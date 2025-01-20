import { ManualValuationInput } from '../types.ts'

export function validateManualValuationInput(input: any): { 
  success: boolean;
  errors: string[];
} {
  const errors: string[] = []

  // Required fields validation with detailed logging
  console.log('Validating input:', input)
  
  if (!input.make) errors.push('Make is required')
  if (!input.model) errors.push('Model is required')
  if (!input.year) errors.push('Year is required')
  if (!input.mileage) errors.push('Mileage is required')
  if (!input.transmission) errors.push('Transmission is required')
  if (!input.fuel) errors.push('Fuel type is required')
  if (!input.country) errors.push('Country is required')

  // Type validations
  if (input.year && (isNaN(input.year) || input.year < 1900 || input.year > new Date().getFullYear() + 1)) {
    errors.push('Invalid year')
  }

  if (input.mileage && (isNaN(input.mileage) || input.mileage < 0)) {
    errors.push('Invalid mileage')
  }

  if (input.capacity && (isNaN(input.capacity) || input.capacity < 0)) {
    errors.push('Invalid capacity')
  }

  // Enum validations
  const validTransmissions = ['manual', 'automatic']
  if (input.transmission && !validTransmissions.includes(input.transmission)) {
    errors.push('Invalid transmission type')
  }

  const validFuelTypes = ['petrol', 'diesel', 'electric', 'hybrid']
  if (input.fuel && !validFuelTypes.includes(input.fuel)) {
    errors.push('Invalid fuel type')
  }

  const validCountries = ['PL', 'DE', 'UK']
  if (input.country && !validCountries.includes(input.country)) {
    errors.push('Invalid country code')
  }

  console.log('Validation result:', { success: errors.length === 0, errors })

  return {
    success: errors.length === 0,
    errors
  }
}