
/**
 * Form submission utility functions
 * Created: 2025-04-17
 * Updated: 2025-05-10 - Fixed TypeScript errors with title property
 * Updated: 2025-05-30 - Fixed camelCase/snake_case field name issues
 * Updated: 2025-05-31 - Fixed TypeScript errors with field property types
 * Updated: 2025-06-01 - Fixed name property access and updatedAt handling
 * Updated: 2025-06-13 - Removed leatherSeats references to fix compilation errors
 */

import { CarListingFormData } from '@/types/forms';

/**
 * Prepares form data for database submission
 * Formats and validates the data before sending to the server
 */
export const prepareSubmission = (formData: CarListingFormData) => {
  // Convert string numbers to actual numbers
  const numericFields = ['year', 'mileage', 'price'];
  const formattedData = { ...formData };
  
  // Format numeric fields
  for (const field of numericFields) {
    if (formattedData[field] !== undefined && formattedData[field] !== null) {
      formattedData[field] = Number(formattedData[field]);
    }
  }
  
  // Generate display title if not already set
  if (!formattedData.make || !formattedData.model || !formattedData.year) {
    // Skip title generation if we don't have the required fields
  } else {
    // Generate a display title based on car details
    formattedData.title = `${formattedData.make} ${formattedData.model} ${formattedData.year}`;
  }
  
  // Ensure status is correctly set
  formattedData.status = 'pending';
  
  // Add timestamps
  formattedData.updatedAt = new Date().toISOString();
  
  // Remove any transient properties not needed in database
  if (formattedData.formMetadata) {
    delete formattedData.formMetadata;
  }
  
  return formattedData;
};
