
import { corsHeaders } from './cors.ts';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export function validateUpload(file: File, type: string): void {
  if (!file || !type) {
    throw new Error('Missing required fields');
  }

  // Validate file type based on upload category
  const isServiceDocument = type.includes('service_document');
  const allowedTypes = isServiceDocument 
    ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
    : ALLOWED_IMAGE_TYPES;
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed for ${isServiceDocument ? 'documents' : 'images'}`);
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
}
