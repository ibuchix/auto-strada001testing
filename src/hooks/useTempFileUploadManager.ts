
/**
 * Temporary File Upload Manager Hook
 * Created: 2025-05-19
 * Updated: 2025-05-24 - Added better tracking and management of temporary files
 * Updated: 2025-06-21 - Enhanced to work with direct database inserts for associating files
 */

import { useState, useRef, useCallback } from 'react';

interface UploadRegistration {
  id: string;
  file: File;
  startTime: number; 
}

export const useTempFileUploadManager = () => {
  const pendingUploadsRef = useRef<Record<string, UploadRegistration>>({});
  const [pendingCount, setPendingCount] = useState<number>(0);
  
  // Register a new upload
  const registerUpload = useCallback((file: File): string => {
    const id = `upload_${Math.random().toString(36).substring(2, 10)}`;
    
    pendingUploadsRef.current[id] = {
      id,
      file,
      startTime: Date.now()
    };
    
    setPendingCount(current => current + 1);
    
    console.log(`[TempFileUploadManager] Registered upload ${id} for ${file.name}, total pending: ${Object.keys(pendingUploadsRef.current).length}`);
    
    return id;
  }, []);
  
  // Mark an upload as complete
  const registerCompletion = useCallback((id: string) => {
    if (pendingUploadsRef.current[id]) {
      const elapsedMs = Date.now() - pendingUploadsRef.current[id].startTime;
      console.log(`[TempFileUploadManager] Upload ${id} complete in ${elapsedMs}ms`);
      
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
  }, []);
  
  return {
    registerUpload,
    registerCompletion,
    registerFailure,
    getPendingCount,
    hasUploadsInProgress,
    resetManager,
    pendingCount
  };
};

export default useTempFileUploadManager;
