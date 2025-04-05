
/**
 * Upload diagnostics service for tracking upload attempts
 * Simplified for better performance in production
 */

export interface UploadAttempt {
  id: string;
  timestamp: string;
  filename: string;
  fileSize: number;
  fileType: string;
  success: boolean;
  uploadPath: string;
  error?: string;
  responseData?: {
    filePath?: string;
    [key: string]: any;
  };
}

// In-memory storage for upload attempts (limited capacity)
const uploadAttempts: UploadAttempt[] = [];
const MAX_ATTEMPTS = 100;

/**
 * Log a new upload attempt
 */
export const logUploadAttempt = (data: Omit<UploadAttempt, 'id' | 'timestamp'>): string => {
  // Skip in production to improve performance
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  
  const id = `upload-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  
  const attempt: UploadAttempt = {
    id,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  // Add to the beginning (most recent first)
  uploadAttempts.unshift(attempt);
  
  // Limit the number of stored attempts
  if (uploadAttempts.length > MAX_ATTEMPTS) {
    uploadAttempts.pop();
  }
  
  return id;
};

/**
 * Update an existing upload attempt
 */
export const updateUploadAttempt = (id: string, updates: Partial<UploadAttempt>): void => {
  // Skip in production to improve performance
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  const index = uploadAttempts.findIndex(attempt => attempt.id === id);
  if (index !== -1) {
    uploadAttempts[index] = { ...uploadAttempts[index], ...updates };
  }
};

/**
 * Get all upload attempts for debugging
 */
export const getUploadAttempts = (): UploadAttempt[] => {
  return [...uploadAttempts];
};

/**
 * Clear all upload attempts
 */
export const clearUploadAttempts = (): void => {
  uploadAttempts.length = 0;
};
