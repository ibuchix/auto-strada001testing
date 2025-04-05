
/**
 * Service for tracking upload attempts and diagnostics
 * - Logs upload attempts for analytics and debugging
 * - Provides a way to update attempt status
 */

type UploadAttempt = {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  uploadPath: string;
  success: boolean;
  timestamp: string;
  error?: string;
  responseData?: any;
};

// In-memory storage for upload attempts
const uploadAttempts: Record<string, UploadAttempt> = {};

/**
 * Logs an upload attempt and returns an ID for tracking
 */
export const logUploadAttempt = (attempt: Omit<UploadAttempt, 'id' | 'timestamp'>): string => {
  // Generate a simple ID for the attempt
  const id = Math.random().toString(36).substring(2, 15);
  
  // Store the attempt with timestamp
  uploadAttempts[id] = {
    ...attempt,
    id,
    timestamp: new Date().toISOString()
  };
  
  console.log(`[Upload Diagnostics] Logged attempt ${id}:`, uploadAttempts[id]);
  return id;
};

/**
 * Updates an existing upload attempt with results
 */
export const updateUploadAttempt = (id: string, update: Partial<UploadAttempt>): void => {
  if (!uploadAttempts[id]) {
    console.warn(`[Upload Diagnostics] Attempt ${id} not found`);
    return;
  }
  
  uploadAttempts[id] = {
    ...uploadAttempts[id],
    ...update,
    timestamp: new Date().toISOString()
  };
  
  console.log(`[Upload Diagnostics] Updated attempt ${id}:`, uploadAttempts[id]);
};

/**
 * Gets upload statistics for analysis
 */
export const getUploadStats = (): { 
  total: number;
  success: number;
  failed: number;
  averageSize: number;
} => {
  const attempts = Object.values(uploadAttempts);
  const total = attempts.length;
  const success = attempts.filter(a => a.success).length;
  const totalSize = attempts.reduce((sum, a) => sum + a.fileSize, 0);
  
  return {
    total,
    success,
    failed: total - success,
    averageSize: total > 0 ? totalSize / total : 0
  };
};
