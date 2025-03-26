
/**
 * Changes made:
 * - 2028-06-01: Created diagnostic utilities for photo upload troubleshooting
 */

interface PhotoUploadAttempt {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  startTime: string;
  endTime?: string;
  success: boolean;
  error?: string;
  uploadPath?: string;
  responseData?: any;
}

/**
 * Track upload attempts for diagnostic purposes
 */
export const logUploadAttempt = (data: Omit<PhotoUploadAttempt, 'id' | 'startTime'>) => {
  try {
    const existingData = localStorage.getItem('photoUploadDiagnostics') || '[]';
    const attempts = JSON.parse(existingData) as PhotoUploadAttempt[];
    
    // Limit array size to prevent localStorage overflow
    if (attempts.length > 50) {
      attempts.shift(); // Remove oldest entry
    }
    
    const newAttempt: PhotoUploadAttempt = {
      ...data,
      id: crypto.randomUUID(),
      startTime: new Date().toISOString()
    };
    
    attempts.push(newAttempt);
    localStorage.setItem('photoUploadDiagnostics', JSON.stringify(attempts));
    
    // Also log to console for immediate visibility
    console.log('[PHOTO UPLOAD]', 
      data.success ? 'SUCCESS' : 'FAILED', 
      data.filename, 
      data.fileSize, 
      data.error || ''
    );
    
    return newAttempt.id;
  } catch (error) {
    console.error('Failed to log upload attempt:', error);
    return null;
  }
};

/**
 * Update an existing upload attempt record (e.g., on completion)
 */
export const updateUploadAttempt = (id: string, data: Partial<PhotoUploadAttempt>) => {
  try {
    const existingData = localStorage.getItem('photoUploadDiagnostics') || '[]';
    const attempts = JSON.parse(existingData) as PhotoUploadAttempt[];
    
    const index = attempts.findIndex(item => item.id === id);
    if (index !== -1) {
      attempts[index] = {
        ...attempts[index],
        ...data,
        endTime: data.endTime || new Date().toISOString()
      };
      
      localStorage.setItem('photoUploadDiagnostics', JSON.stringify(attempts));
    }
  } catch (error) {
    console.error('Failed to update upload attempt:', error);
  }
};

/**
 * Get all upload attempts
 */
export const getUploadAttempts = (): PhotoUploadAttempt[] => {
  try {
    const existingData = localStorage.getItem('photoUploadDiagnostics') || '[]';
    return JSON.parse(existingData) as PhotoUploadAttempt[];
  } catch (error) {
    console.error('Failed to get upload attempts:', error);
    return [];
  }
};

/**
 * Clear all upload attempt records
 */
export const clearUploadAttempts = () => {
  localStorage.removeItem('photoUploadDiagnostics');
};
