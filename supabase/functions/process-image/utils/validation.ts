
/**
 * Validation utilities for the process-image edge function
 */

export function validateUpload(file: File, type: string) {
  // Check if file exists
  if (!file) {
    throw new Error('No file provided');
  }
  
  // Check if type is provided
  if (!type) {
    throw new Error('File category (type) is required');
  }
  
  // Validate file type (allow images only)
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf' // Allow PDFs for documents
  ];
  
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }
  
  // Validate file size (max 10MB)
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeBytes) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 10MB`);
  }
  
  return true;
}
