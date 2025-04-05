
/**
 * Service for tracking upload attempts and diagnostics
 * Simplified for production with minimal logging
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
};

// In-memory storage for upload attempts (only in development)
const uploadAttempts: Record<string, UploadAttempt> = {};

/**
 * Logs an upload attempt and returns an ID for tracking
 */
export const logUploadAttempt = (attempt: Omit<UploadAttempt, 'id' | 'timestamp'>): string => {
  // Generate a simple ID for the attempt
  const id = Math.random().toString(36).substring(2, 15);
  
  if (process.env.NODE_ENV !== 'production') {
    // Only store attempts in development
    uploadAttempts[id] = {
      ...attempt,
      id,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Upload] Attempt ${id}:`, {
      filename: attempt.filename,
      fileSize: attempt.fileSize
    });
  }
  
  return id;
};

/**
 * Updates an existing upload attempt with results
 */
export const updateUploadAttempt = (id: string, update: Partial<UploadAttempt>): void => {
  if (process.env.NODE_ENV === 'production') {
    // In production, only log errors
    if (!update.success) {
      console.error(`[Upload] Failed: ${update.error}`, {
        id
      });
    }
    return;
  }
  
  if (!uploadAttempts[id]) {
    console.warn(`[Upload] Attempt ${id} not found`);
    return;
  }
  
  uploadAttempts[id] = {
    ...uploadAttempts[id],
    ...update,
    timestamp: new Date().toISOString()
  };
  
  if (update.success) {
    console.log(`[Upload] Attempt ${id} completed successfully`);
  } else {
    console.error(`[Upload] Attempt ${id} failed: ${update.error}`);
  }
};

/**
 * Gets upload statistics for analysis (development only)
 */
export const getUploadStats = (): { 
  total: number;
  success: number;
  failed: number;
  averageSize: number;
} => {
  if (process.env.NODE_ENV === 'production') {
    // Return empty stats in production
    return { total: 0, success: 0, failed: 0, averageSize: 0 };
  }
  
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
