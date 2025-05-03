
/**
 * Form submission utility functions
 * Created: 2025-04-17
 * Updated: 2025-05-10 - Fixed TypeScript errors with title property
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
    formattedData.name = `${formattedData.make} ${formattedData.model} ${formattedData.year}`;
  }
  
  // Ensure status is correctly set
  formattedData.status = 'pending';
  
  // Add timestamps
  formattedData.updated_at = new Date().toISOString();
  
  // Remove any transient properties not needed in database
  delete formattedData.form_metadata;
  
  return formattedData;
};
