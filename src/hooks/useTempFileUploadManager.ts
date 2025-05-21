
/**
 * Temporary File Upload Manager Hook
 * Created: 2025-05-19
 * Updated: 2025-05-24 - Added better tracking and management of temporary files
 * Updated: 2025-06-21 - Enhanced to work with direct database inserts for associating files
 * Updated: 2025-05-21 - Updated to work with enhanced RLS policies
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UploadRegistration {
  id: string;
  file: File;
  startTime: number;
  category?: string;
}

export const useTempFileUploadManager = () => {
  const pendingUploadsRef = useRef<Record<string, UploadRegistration>>({});
  const [pendingCount, setPendingCount] = useState<number>(0);
  
  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedUploads = localStorage.getItem('temp_car_uploads');
      if (storedUploads) {
        const uploads = JSON.parse(storedUploads);
        if (Array.isArray(uploads) && uploads.length > 0) {
          console.log(`[TempFileUploadManager] Found ${uploads.length} previously stored uploads`);
        }
      }
    } catch (error) {
      console.error('[TempFileUploadManager] Error parsing stored uploads:', error);
    }
  }, []);
  
  // Register a new upload
  const registerUpload = useCallback((file: File, category?: string): string => {
    const id = `upload_${Math.random().toString(36).substring(2, 10)}`;
    
    pendingUploadsRef.current[id] = {
      id,
      file,
      startTime: Date.now(),
      category
    };
    
    setPendingCount(current => current + 1);
    
    console.log(`[TempFileUploadManager] Registered upload ${id} for ${file.name}, category: ${category}, total pending: ${Object.keys(pendingUploadsRef.current).length}`);
    
    return id;
  }, []);
  
  // Mark an upload as complete
  const registerCompletion = useCallback((id: string, filePath?: string, category?: string) => {
    if (pendingUploadsRef.current[id]) {
      const elapsedMs = Date.now() - pendingUploadsRef.current[id].startTime;
      console.log(`[TempFileUploadManager] Upload ${id} complete in ${elapsedMs}ms`);
      
      // If we have additional info, update the temp_car_uploads in localStorage
      if (filePath && category) {
        try {
          const existingUploads = localStorage.getItem('temp_car_uploads');
          const uploads = existingUploads ? JSON.parse(existingUploads) : [];
          
          // Check if this path is already in the uploads
          const exists = uploads.some((upload: any) => upload.filePath === filePath);
          
          if (!exists) {
            uploads.push({
              filePath,
              category,
              uploadTime: new Date().toISOString()
            });
            localStorage.setItem('temp_car_uploads', JSON.stringify(uploads));
            console.log(`[TempFileUploadManager] Added ${filePath} to temp uploads in localStorage`);
          }
        } catch (error) {
          console.error('[TempFileUploadManager] Error updating localStorage:', error);
        }
      }
      
      delete pendingUploadsRef.current[id];
      setPendingCount(current => Math.max(0, current - 1));
    }
  }, []);
  
  // Mark an upload as failed
  const registerFailure = useCallback((id: string) => {
    if (pendingUploadsRef.current[id]) {
      const elapsedMs = Date.now() - pendingUploadsRef.current[id].startTime;
      console.warn(`[TempFileUploadManager] Upload ${id} failed after ${elapsedMs}ms`);
      
      delete pendingUploadsRef.current[id];
      setPendingCount(current => Math.max(0, current - 1));
    }
  }, []);
  
  // Get the number of pending uploads
  const getPendingCount = useCallback(() => {
    return Object.keys(pendingUploadsRef.current).length;
  }, []);
  
  // Check if there are any uploads in progress
  const hasUploadsInProgress = useCallback(() => {
    return getPendingCount() > 0;
  }, [getPendingCount]);
  
  // Reset the manager (useful for cleanup)
  const resetManager = useCallback(() => {
    pendingUploadsRef.current = {};
    setPendingCount(0);
    
    // Also clear localStorage if needed
    localStorage.removeItem('temp_car_uploads');
    console.log('[TempFileUploadManager] Reset manager and cleared localStorage');
  }, []);
  
  // Get all pending uploads for status display
  const getPendingUploads = useCallback(() => {
    return Object.values(pendingUploadsRef.current);
  }, []);
  
  return {
    registerUpload,
    registerCompletion,
    registerFailure,
    getPendingCount,
    getPendingUploads,
    hasUploadsInProgress,
    resetManager,
    pendingCount
  };
};

export default useTempFileUploadManager;
