
/**
 * Data Preparation Utilities for Form Submission
 * Created: 2025-05-18
 * Updated: 2025-05-19 - Added support for transforming photo uploads
 * Updated: 2025-05-20 - Fixed type conversion issues for numeric fields
 * Updated: 2025-05-28 - Updated to use camelCase field names consistently
 */

import { CarListingFormData } from "@/types/forms";

/**
 * Process form data before submission to API
 * Handles field type conversions and transformations
 */
export const prepareFormData = (formData: CarListingFormData): Record<string, any> => {
  // Create a copy of the form data
  const processedData = { ...formData };
  
  // Convert string numbers to actual numbers
  if (processedData.year) processedData.year = Number(processedData.year);
  if (processedData.mileage) processedData.mileage = Number(processedData.mileage);
  if (processedData.price) processedData.price = Number(processedData.price);
  if (processedData.reservePrice) processedData.reservePrice = Number(processedData.reservePrice);
  if (processedData.financeAmount) processedData.financeAmount = Number(processedData.financeAmount);
  
  // Generate a display title/name for the listing
  if (!processedData.title && processedData.make && processedData.model) {
    processedData.title = `${processedData.make} ${processedData.model} ${processedData.year || ''}`;
  }
  
  // Ensure all required boolean fields are explicitly set
  processedData.isDamaged = !!processedData.isDamaged;
  processedData.hasPrivatePlate = !!processedData.hasPrivatePlate;
  processedData.hasOutstandingFinance = !!processedData.hasOutstandingFinance;
  processedData.hasServiceHistory = !!processedData.hasServiceHistory;
  processedData.isRegisteredInPoland = !!processedData.isRegisteredInPoland;
  
  // Add timestamps
  processedData.updated_at = new Date().toISOString();
  
  return processedData;
};

/**
 * Transform uploaded files to the right format for storage
 */
export const transformUploadedFiles = (uploads: any[]): Record<string, any>[] => {
  if (!Array.isArray(uploads)) return [];
  
  return uploads.map(upload => ({
    name: upload.name || 'unnamed-file',
    url: upload.url || upload.location || '',
    type: upload.type || 'unknown',
    size: upload.size || 0,
    uploaded_at: upload.uploadedAt || upload.uploaded_at || new Date().toISOString()
  }));
};
